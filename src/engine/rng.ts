/** Générateur pseudo-aléatoire déterministe (mulberry32), état stocké dans la partie. */
export interface RngHolder {
  rng: number;
}

export function random(h: RngHolder): number {
  h.rng = (h.rng + 0x6d2b79f5) | 0;
  let t = h.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function randInt(h: RngHolder, maxExclusive: number): number {
  return Math.floor(random(h) * maxExclusive);
}

export function pick<T>(h: RngHolder, arr: readonly T[]): T {
  return arr[randInt(h, arr.length)];
}

/** Tirage pondéré : renvoie l'index choisi. */
export function weightedIndex(h: RngHolder, weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = random(h) * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1;
}
