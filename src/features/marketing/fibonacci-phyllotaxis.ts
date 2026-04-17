/** φ = (1 + √5) / 2 — golden ratio. */
const SQRT_5 = Math.sqrt(5);
export const PHI = (1 + SQRT_5) / 2;

/**
 * Phyllotaxis angle (radians): 2π/φ² — seed arrangement seen in sunflowers / pine cones.
 */
export const GOLDEN_ANGLE_RAD = (2 * Math.PI) / (PHI * PHI);

export type PhyllotaxisSeed = {
  cx: number;
  cy: number;
  /** Index for sizing / animation tier (0–4). */
  tier: number;
};

/**
 * Spiral seed positions on a disc; radial distance grows √n so packing stays even.
 */
export function buildPhyllotaxisSeeds(
  count: number,
  radialScale: number,
  centerX: number,
  centerY: number,
): readonly PhyllotaxisSeed[] {
  const seeds: PhyllotaxisSeed[] = [];
  for (let i = 0; i < count; i += 1) {
    const n = i + 1;
    const r = radialScale * Math.sqrt(n);
    const theta = n * GOLDEN_ANGLE_RAD;
    seeds.push({
      cx: centerX + r * Math.cos(theta),
      cy: centerY + r * Math.sin(theta),
      tier: i % 5,
    });
  }
  return seeds;
}
