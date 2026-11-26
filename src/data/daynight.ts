/** Cycle jour/nuit (temps de jeu). Astronomie : bonus de nuit (§5). */
export const DAY_NIGHT = {
  /** Durée d'une journée complète (s de jeu). */
  cycleSeconds: 600,
  /** Bornes des phases, en fraction du cycle : jour → crépuscule → nuit → aube. */
  duskStart: 0.55,
  nightStart: 0.65,
  dawnStart: 0.9,
  /** Multiplicateur d'Éclats de l'Astronomie la nuit. */
  astronomyNightMult: 1.5,
};

export type DayPhase = 'day' | 'dusk' | 'night' | 'dawn';

export function dayFraction(time: number): number {
  const c = DAY_NIGHT.cycleSeconds;
  return (((time % c) + c) % c) / c;
}

export function dayPhase(time: number): DayPhase {
  const f = dayFraction(time);
  if (f < DAY_NIGHT.duskStart) return 'day';
  if (f < DAY_NIGHT.nightStart) return 'dusk';
  if (f < DAY_NIGHT.dawnStart) return 'night';
  return 'dawn';
}

/** 0 en plein jour, 1 en pleine nuit, transition douce au crépuscule et à l'aube. */
export function nightFactor(time: number): number {
  const f = dayFraction(time);
  const { duskStart, nightStart, dawnStart } = DAY_NIGHT;
  if (f < duskStart) return 0;
  if (f < nightStart) return (f - duskStart) / (nightStart - duskStart);
  if (f < dawnStart) return 1;
  return 1 - (f - dawnStart) / (1 - dawnStart);
}
