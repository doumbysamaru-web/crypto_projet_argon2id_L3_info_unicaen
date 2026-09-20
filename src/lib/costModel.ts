/**
 * A deliberately illustrative cost model.
 *
 * The engine in argon2.ts is a real, RFC-9106-correct implementation, but it
 * runs in well under a second even at the demo's maximum (browser-safe)
 * memory size — real Argon2id deployments use 20-60x more memory than we can
 * safely render as a grid. So the on-screen stopwatch does not show actual
 * JS execution time; it shows a pedagogical estimate, scaled so the *shape*
 * of the relationship (linear in m, linear in t, roughly divided by p) is
 * honest and visible, even though the absolute numbers are illustrative
 * rather than a hardware benchmark. The UI always labels it as such, and
 * separately shows the real measured in-browser computation time.
 */

const MS_PER_KIB_PASS = 6;

export function effectiveParallelSpeedup(p: number): number {
  return 1 + (p - 1) * 0.65;
}

/** Illustrative estimated wall-clock time for one Argon2id hash, in ms. */
export function estimateArgon2Ms(mPrime: number, t: number, p: number): number {
  const raw = (mPrime * t * MS_PER_KIB_PASS) / effectiveParallelSpeedup(p);
  return Math.max(15, raw);
}

/** Classic hash functions are not memory-hard: their cost is ~constant, independent of m/t/p. */
export const CLASSIC_HASH_MS = {
  'SHA-256': 0.0026,
  'SHA-3-256': 0.0041,
} as const;

/** Negligible, fixed internal state — unlike Argon2id, whose footprint IS the defense. */
export const CLASSIC_HASH_MEMORY_KIB = 0.25;

export function formatMs(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)} µs`;
  if (ms < 1000) return `${ms.toFixed(ms < 10 ? 2 : 0)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function formatKiB(kib: number): string {
  if (kib < 1) return `${(kib * 1024).toFixed(0)} o`;
  if (kib < 1024) return `${kib.toFixed(kib < 10 ? 2 : 0)} Ko`;
  return `${(kib / 1024).toFixed(2)} Mo`;
}

export function formatRatio(a: number, b: number): string {
  const ratio = a / b;
  if (ratio >= 1_000_000) return `×${(ratio / 1_000_000).toFixed(1)} M`;
  if (ratio >= 1_000) return `×${(ratio / 1_000).toFixed(1)} k`;
  return `×${ratio.toFixed(1)}`;
}
