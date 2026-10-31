interface ResolutionLimits {
  pixelBudget: number;
  pixelRatio: number;
  maxDimension: number;
}

export function fitPixelBudget(
  width: number,
  height: number,
  budget: number,
  maxDimension: number,
) {
  if (
    !Number.isFinite(width) ||
    width <= 0 ||
    !Number.isFinite(height) ||
    height <= 0 ||
    !Number.isSafeInteger(budget) ||
    budget < 1 ||
    !Number.isSafeInteger(maxDimension) ||
    maxDimension < 1
  )
    throw new Error("描画解像度の上限と画面寸法が不正です。");
  const scale = Math.min(
    1,
    Math.sqrt(budget / width / height),
    maxDimension / width,
    maxDimension / height,
  );
  const w = Math.max(1, Math.min(Math.floor(width * scale), budget));
  const h = Math.max(1, Math.min(Math.floor(height * scale), Math.floor(budget / w)));
  return { width: w, height: h };
}

export function renderingSize(
  width: number,
  height: number,
  devicePixelRatio: number,
  limits: ResolutionLimits,
) {
  const ratio = Math.min(devicePixelRatio, limits.pixelRatio);
  return fitPixelBudget(width * ratio, height * ratio, limits.pixelBudget, limits.maxDimension);
}
