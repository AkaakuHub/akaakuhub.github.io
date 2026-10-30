export function thumbnailBounds(
  imageWidth: number,
  imageHeight: number,
  paperWidth: number,
  paperHeight: number,
) {
  const margin = paperWidth * 0.015;
  const scale = Math.min(
    (paperWidth - margin * 2) / imageWidth,
    (paperHeight - margin * 2) / imageHeight,
  );
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return { x: (paperWidth - width) / 2, y: (paperHeight - height) / 2, width, height };
}
