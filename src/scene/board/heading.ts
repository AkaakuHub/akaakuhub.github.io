import { CanvasTexture, Mesh, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace } from "three";

export function createBoardHeading() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("ホワイトボードの見出しを描画できませんでした。");
  context.font = '400 176px "Yomogi"';
  context.fillStyle = "#284a40";
  context.fillText("最新記事", 36, 190);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  const heading = new Mesh(
    new PlaneGeometry(0.65, 0.1625),
    new MeshStandardMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      roughness: 1,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
  );
  heading.position.set(0.39, 2.265, 0.0455);
  heading.rotation.z = -0.012;
  heading.receiveShadow = true;
  return heading;
}
