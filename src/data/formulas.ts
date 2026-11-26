/**
 * Formules centrales (§5, §6 ter, §7). Fonctions pures, sans état.
 * Le plancher universel : jamais moins de 25 % du temps de base.
 */
export const TIME_FLOOR = 0.25;

/** Réduction de Confort : min(confort × 0,02 ; 0,5). */
export function comfortReduction(comfort: number): number {
  return Math.min(Math.max(comfort, 0) * 0.02, 0.5);
}

/** Applique une liste de multiplicateurs à un temps de base, avec plancher. */
export function applyTime(base: number, mults: number[]): number {
  const raw = mults.reduce((acc, m) => acc * m, base);
  return Math.max(raw, base * TIME_FLOOR);
}

/** Coût exponentiel générique : base × growth^n. */
export function expCost(base: number, growth: number, n: number): number {
  return Math.round(base * Math.pow(growth, n));
}
