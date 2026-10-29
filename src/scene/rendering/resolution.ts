export function fitPixelBudget(width: number, height: number, budget: number) {
  const scale = Math.min(1, Math.sqrt(budget / (width * height)));
  const w = Math.max(1, Math.floor(width * scale));
  const h = Math.max(1, Math.min(Math.floor(height * scale), Math.floor(budget / w)));
  return { width: w, height: h };
}
