const desktop = {
  pixelBudget: 1_400_000,
  pixelRatio: 1.25,
  scatteringSteps: 48,
  shadowSize: 2048,
  anisotropy: 4,
};
const mobile = {
  pixelBudget: 500_000,
  pixelRatio: 1.25,
  scatteringSteps: 24,
  shadowSize: 1024,
  anisotropy: 2,
};

export function renderingProfile() {
  return window.matchMedia("(pointer: coarse)").matches ? mobile : desktop;
}
