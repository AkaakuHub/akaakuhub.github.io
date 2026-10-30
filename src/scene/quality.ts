const desktop = {
  pixelBudget: 3_000_000,
  motionPixelBudget: 650_000,
  pixelRatio: 2,
  shadowSize: 2048,
  anisotropy: 4,
};
const mobile = {
  pixelBudget: 1_500_000,
  motionPixelBudget: 220_000,
  pixelRatio: 2,
  shadowSize: 1024,
  anisotropy: 2,
};

const recovery = {
  pixelBudget: 400_000,
  motionPixelBudget: 120_000,
  pixelRatio: 1,
  shadowSize: 512,
  anisotropy: 1,
};

export function renderingProfile(recovering = false) {
  if (recovering) return recovery;
  return window.matchMedia("(pointer: coarse)").matches ? mobile : desktop;
}
