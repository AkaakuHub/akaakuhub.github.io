import argparse
import asyncio
import base64
import json
import subprocess
import time
import re
from pathlib import Path

from playwright.async_api import async_playwright


async def export_scene(options):
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            executable_path=options.browser,
            headless=True,
            args=["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
        )
        page = await browser.new_page(viewport={"width":320,"height":200})
        cdp = await page.context.new_cdp_session(page)
        await cdp.send("Emulation.setHardwareConcurrencyOverride", {"hardwareConcurrency":4})
        revision = time.time_ns()

        async def fresh(route):
            separator = "&" if "?" in route.request.url else "?"
            response = await route.fetch(url=f"{route.request.url}{separator}bake_revision={revision}", headers={key:value for key,value in route.request.headers.items() if key.lower() not in {"if-none-match","if-modified-since"}})
            await route.fulfill(response=response)

        await page.route(re.compile(r".*\.(?:ts|json)(?:\?.*)?$"), fresh)
        entry = options.module_root + "scripts/lighting/entry.ts"
        source = f"import {{exportRoom}} from {json.dumps(entry)}; try{{globalThis.bakeExport=await exportRoom()}}catch(error){{globalThis.bakeError=String(error)}}"
        await page.route("**/src/main.ts*", lambda route:route.fulfill(content_type="application/javascript",body=source))
        await page.route("**/@vite/client", lambda route:route.fulfill(content_type="application/javascript",body=""))
        await page.goto(options.url, wait_until="domcontentloaded")
        await page.wait_for_function("Boolean(globalThis.bakeExport||globalThis.bakeError)", timeout=180_000)
        result = await page.evaluate("""()=>{
            if(globalThis.bakeError)throw new Error(globalThis.bakeError);
            const {binary,...metadata}=globalThis.bakeExport;
            let encoded='';
            for(let i=0;i<binary.length;i+=8192)encoded+=String.fromCharCode(...binary.subarray(i,i+8192));
            return {binary:btoa(encoded),metadata};
        }""")
        options.work_directory.mkdir(parents=True,exist_ok=True)
        (options.work_directory/"scene.glb").write_bytes(base64.b64decode(result["binary"]))
        (options.work_directory/"scene.json").write_text(json.dumps(result["metadata"],separators=(",",":")))
        await browser.close()


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True)
    parser.add_argument("--browser", required=True)
    parser.add_argument("--blender", default="blender")
    parser.add_argument("--module-root", default="/")
    parser.add_argument("--work-directory", type=Path, required=True)
    parser.add_argument("--samples", type=int, default=256)
    options = parser.parse_args()
    options.work_directory = options.work_directory.resolve()
    if not options.module_root.startswith("/") or not options.module_root.endswith("/"):
        parser.error("module-root must start and end with a slash")
    await export_scene(options)
    subprocess.run(["rtk","proxy",options.blender,"--background","--factory-startup","--threads","4","--python-exit-code","1","--python",str(Path(__file__).with_name("cycles.py").resolve()),"--","--input",str(options.work_directory),"--output",str(Path("src/assets/lighting/fluorescent.data").resolve()),"--samples",str(options.samples)],check=True)
    subprocess.run(["rtk","proxy","node","scripts/assets/catalog.mjs"],check=True)
    for filename in ["scene.glb","scene.json"]:
        (options.work_directory/filename).unlink()


asyncio.run(main())
