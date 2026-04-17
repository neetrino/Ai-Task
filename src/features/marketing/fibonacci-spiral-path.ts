/**
 * Builds an SVG path for a logarithmic (golden) spiral segment — used as a decorative
 * Fibonacci-adjacent curve on marketing surfaces.
 */
const GOLDEN_SPIRAL_GROWTH = 0.306349; // growth constant for r = a·e^(bθ) approximating golden spiral

export function buildGoldenSpiralPath(
  viewCenterX: number,
  viewCenterY: number,
  scale: number,
  pointCount: number,
  maxTheta: number,
): string {
  const a = 0.35;
  const segments: string[] = [];
  for (let i = 0; i <= pointCount; i += 1) {
    const theta = (i / pointCount) * maxTheta;
    const r = a * Math.exp(GOLDEN_SPIRAL_GROWTH * theta);
    const x = viewCenterX + r * Math.cos(theta) * scale;
    const y = viewCenterY + r * Math.sin(theta) * scale;
    const cmd = i === 0 ? 'M' : 'L';
    segments.push(`${cmd} ${x.toFixed(3)} ${y.toFixed(3)}`);
  }
  return segments.join(' ');
}
