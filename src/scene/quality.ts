const desktop = {
  pixelBudget: 3_000_000,
  pixelRatio: 2,
  scatteringSteps: 48,
  shadowSize: 2048,
  anisotropy: 4,
};
const mobile = {
  pixelBudget: 1_500_000,
  pixelRatio: 2,
  scatteringSteps: 24,
  shadowSize: 1024,
  anisotropy: 2,
};

export function renderingProfile() {
  return window.matchMedia("(pointer: coarse)").matches ? mobile : desktop;
}
