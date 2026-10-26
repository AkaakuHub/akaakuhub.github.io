export function fluorescentModulation(seconds: number): number {
  const phase = seconds * Math.PI * 2;
  return (
    1 +
    0.0008 * Math.sin(phase * 0.73) +
    0.0005 * Math.sin(phase * 1.91) +
    0.0002 * Math.sin(phase * 4.13)
  );
}
