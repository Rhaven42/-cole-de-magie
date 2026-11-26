/**
 * Prestige : « Reconstruire la légende » dans un nouvel environnement.
 * Chaque environnement a son propre décor et un bonus permanent cumulatif.
 */
export type EnvId = 'manor' | 'abyss' | 'sky' | 'forest' | 'moon';

export interface EnvDef {
  id: EnvId;
  icon: string;
  ground: string;
  groundAlt: string;
  corridor: string;
  corridorLine: string;
  border: string;
  plaster: string;
  wood: string;
  path: string;
  deco: 'tree' | 'coral' | 'cloud' | 'mushroom' | 'crater';
  /** Fond de l'écran autour de la carte. */
  backdrop: string;
}

export const ENVIRONMENTS: EnvDef[] = [
  {
    id: 'manor',
    icon: '🏰',
    ground: '#6FA552',
    groundAlt: '#7DB35C',
    corridor: '#B07A4A',
    corridorLine: '#9A6B3F',
    border: '#7A4A2A',
    plaster: '#D8C49C',
    wood: '#6B4423',
    path: '#D9C7A3',
    deco: 'tree',
    backdrop: '#2E4425',
  },
  {
    id: 'abyss',
    icon: '🌊',
    ground: '#2F6E8C',
    groundAlt: '#3A7F9E',
    corridor: '#C9B98F',
    corridorLine: '#B3A47C',
    border: '#1F4F66',
    plaster: '#BFE3E8',
    wood: '#2E5C6E',
    path: '#E6D9B0',
    deco: 'coral',
    backdrop: '#1E4D66',
  },
  {
    id: 'sky',
    icon: '☁️',
    ground: '#BFD8F2',
    groundAlt: '#D6E6F7',
    corridor: '#E9DDBF',
    corridorLine: '#D4C6A2',
    border: '#8FA9C7',
    plaster: '#FFF6E8',
    wood: '#B88A4E',
    path: '#FFFFFF',
    deco: 'cloud',
    backdrop: '#9EC3EA',
  },
  {
    id: 'forest',
    icon: '🍄',
    ground: '#3E6B35',
    groundAlt: '#4A7A3E',
    corridor: '#8A6A44',
    corridorLine: '#755A39',
    border: '#2E4A26',
    plaster: '#C9B88E',
    wood: '#4E3420',
    path: '#A8946A',
    deco: 'mushroom',
    backdrop: '#2F5428',
  },
  {
    id: 'moon',
    icon: '🌙',
    ground: '#8C8CA0',
    groundAlt: '#9C9CB0',
    corridor: '#5C5A78',
    corridorLine: '#4C4A66',
    border: '#3A3850',
    plaster: '#D9D6EE',
    wood: '#4A4466',
    path: '#B8B6CC',
    deco: 'crater',
    backdrop: '#1E1C30',
  },
];

export const PRESTIGE = {
  /** Diplômé·es nécessaires pour reconstruire : base + perLevel × niveau. */
  graduatesBase: 40,
  graduatesPerLevel: 15,
  /** Bonus permanent d'Éclats par niveau de prestige. */
  coinBonusPerLevel: 0.25,
  /** Gemmes offertes à chaque reconstruction. */
  gems: 10,
};
