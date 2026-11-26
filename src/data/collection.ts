/** Collection de reliques (§9 « collection »). Chaque relique donne un petit bonus permanent. */
export type RelicSet = 'founders' | 'stars' | 'sea' | 'forest';

export interface RelicDef {
  id: string;
  set: RelicSet;
  icon: string;
}

export const RELICS: RelicDef[] = [
  { id: 'quill', set: 'founders', icon: '🪶' },
  { id: 'key', set: 'founders', icon: '🗝️' },
  { id: 'hourglass', set: 'founders', icon: '⏳' },
  { id: 'grimoire', set: 'founders', icon: '📕' },
  { id: 'comet', set: 'stars', icon: '☄️' },
  { id: 'astrolabe', set: 'stars', icon: '🧭' },
  { id: 'moonstone', set: 'stars', icon: '🌙' },
  { id: 'starmap', set: 'stars', icon: '🗺️' },
  { id: 'pearl', set: 'sea', icon: '🫧' },
  { id: 'shell', set: 'sea', icon: '🐚' },
  { id: 'trident', set: 'sea', icon: '🔱' },
  { id: 'coral', set: 'sea', icon: '🪸' },
  { id: 'acorn', set: 'forest', icon: '🌰' },
  { id: 'mushroom', set: 'forest', icon: '🍄' },
  { id: 'feather', set: 'forest', icon: '🍃' },
  { id: 'amber', set: 'forest', icon: '🟠' },
];

export const RELIC_SETS: RelicSet[] = ['founders', 'stars', 'sea', 'forest'];

/** Bonus d'Éclats : +1 % par relique différente, +5 % par collection complète. */
export const RELIC_BONUS = { perRelic: 0.01, perSet: 0.05 };
