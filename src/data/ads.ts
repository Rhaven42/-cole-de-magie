/**
 * Bonus « pub » (vidéo récompensée), comme dans les idle games : une offre apparaît
 * de temps en temps sur la carte, avec un temps de recharge.
 * Aucune régie n'est branchée : la vidéo est simulée (voir src/services/ads.ts).
 */
export type AdKind = 'double' | 'coins' | 'gems';

export const ADS = {
  /** Première offre après (s de jeu). */
  firstAt: 120,
  /** Délai entre deux offres (s de jeu), après une offre prise ou refusée. */
  cooldown: 240,
  /** ×2 Éclats pendant (s). */
  doubleSeconds: 300,
  /** Éclats offerts : équivalent de N minutes de gains (minimum `coinsMin`). */
  coinsMinutes: 3,
  coinsMin: 200,
  gems: 2,
  /** Durée de la vidéo simulée (s réelles). */
  videoSeconds: 5,
} as const;

export const AD_KINDS: AdKind[] = ['double', 'coins', 'gems'];

export const AD_LABEL: Record<AdKind, { icon: string; title: string }> = {
  double: { icon: '⚡', title: 'Éclats ×2 pendant 5 minutes' },
  coins: { icon: '💰', title: 'Une bourse d’Éclats' },
  gems: { icon: '💎', title: '2 Diamants' },
};
