/** Récompense quotidienne : cycle de 7 jours consécutifs. */
export interface DailyReward {
  coins?: number;
  gems?: number;
  relic?: boolean;
}

export const DAILY_REWARDS: DailyReward[] = [
  { coins: 100 },
  { coins: 200 },
  { gems: 2 },
  { coins: 500 },
  { gems: 3 },
  { coins: 1000 },
  { gems: 5, relic: true },
];

/** Les Éclats quotidiens sont multipliés par (1 + nombre de salles × scale). */
export const DAILY_COIN_SCALE = 0.5;
