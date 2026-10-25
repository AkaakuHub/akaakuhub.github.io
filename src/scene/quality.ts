const desktop = {
  pixelBudget: 1_400_000,
  pixelRatio: 1.25,
  motionPixelBudget: 180_000,
  scatteringSteps: 48,
  motionScatteringSteps: 16,
  shadowSize: 2048,
  anisotropy: 4,
};
const mobile = {
  pixelBudget: 500_000,
  pixelRatio: 1.25,
  motionPixelBudget: 80_000,
  scatteringSteps: 24,
  motionScatteringSteps: 8,
  shadowSize: 1024,
  anisotropy: 2,
};

export function renderingProfile() {
  return window.matchMedia("(pointer: coarse)").matches ? mobile : desktop;
}
