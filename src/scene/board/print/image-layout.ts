export function thumbnailBounds(
  imageWidth: number,
  imageHeight: number,
  paperWidth: number,
  paperHeight: number,
) {
  const scale = Math.min((paperWidth * 0.88) / imageWidth, (paperHeight - 82) / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return { x: (paperWidth - width) / 2, y: 25 + (paperHeight - 82 - height) / 2, width, height };
}
