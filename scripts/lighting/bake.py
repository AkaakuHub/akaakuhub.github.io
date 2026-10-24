import argparse
import asyncio
import base64
import gzip
import json
from pathlib import Path

from playwright.async_api import async_playwright


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True)
    parser.add_argument("--browser", required=True)
    options = parser.parse_args()
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            executable_path=options.browser,
            headless=True,
            args=["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
        )
        page = await browser.new_page(viewport={"width": 320, "height": 200}, reduced_motion="reduce")
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))

        async def expose(route):
            response = await route.fetch(headers={key: value for key, value in route.request.headers.items() if key.lower() not in {"if-none-match", "if-modified-since"}})
            source = await response.text()
            source = source.replace("await loadBakedLighting(scene);", "")
            await route.fulfill(response=response, body=source + "\nglobalThis.bakeScene = scene;")

        await page.route("**/src/main.ts*", expose)
        await page.route("**/@vite/client", lambda route: route.fulfill(content_type="application/javascript", body=""))
        await page.goto(options.url, wait_until="domcontentloaded")
        await page.wait_for_function("Boolean(globalThis.bakeScene)", timeout=180_000)
        await page.evaluate("""async () => {
            const { bakeLighting } = await import('/scripts/lighting/bake.ts');
            globalThis.bakeResult = null;
            globalThis.bakeError = null;
            bakeLighting(globalThis.bakeScene, (completed, total) => {
                globalThis.bakeProgress = { completed, total };
            }).then(data => {
                let encoded = '';
                for (let i = 0; i < data.length; i += 8192)
                    encoded += String.fromCharCode(...data.subarray(i, i + 8192));
                globalThis.bakeResult = btoa(encoded);
            }).catch(error => { globalThis.bakeError = String(error); });
        }""")
        previous = None
        while True:
            status = await page.evaluate("({ progress: globalThis.bakeProgress, error: globalThis.bakeError, done: Boolean(globalThis.bakeResult) })")
            if status != previous:
                print(json.dumps(status), flush=True)
                previous = status
            if status.get("error") or errors:
                raise RuntimeError({"status": status, "errors": errors})
            if status["done"]:
                break
            await asyncio.sleep(2)
        encoded = await page.evaluate("globalThis.bakeResult")
        output = Path("public/lighting/fluorescent.data")
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_bytes(gzip.compress(base64.b64decode(encoded), mtime=0))
        print(json.dumps({"file": str(output), "bytes": output.stat().st_size}), flush=True)
        await browser.close()


asyncio.run(main())
