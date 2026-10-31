interface TextureRenderer {
  completedFrame(): Promise<void>;
}

const nextAnimationFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

export async function waitForTextureUpload(
  renderer: TextureRenderer,
  available: () => boolean,
  nextFrame: () => Promise<void> = nextAnimationFrame,
): Promise<void> {
  for (;;) {
    await nextFrame();
    if (!available()) continue;
    await renderer.completedFrame();
    if (available()) return;
  }
}
