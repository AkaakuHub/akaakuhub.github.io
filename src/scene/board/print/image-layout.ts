export function thumbnailBounds(
  imageWidth: number,
  imageHeight: number,
  paperWidth: number,
  paperHeight: number,
) {
  const availableHeight = paperHeight - paperWidth * 0.12;
  const scale = Math.min((paperWidth * 0.96) / imageWidth, availableHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return { x: (paperWidth - width) / 2, y: 15 + (availableHeight - height) / 2, width, height };
}
