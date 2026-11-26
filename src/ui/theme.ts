import { Platform } from 'react-native';

/** Thème « manoir de conte » : bois chaud, parchemin, lueurs de bougie. */
export const colors = {
  night: '#1E1830',
  wood: '#5A3A22',
  woodDark: '#3B2414',
  woodLight: '#8A5A34',
  parchment: '#F6E9CC',
  parchmentDark: '#E8D3A6',
  ink: '#2E2118',
  inkSoft: '#6B5844',
  gold: '#F2B83B',
  goldDark: '#B9831B',
  candle: '#FFD86B',
  good: '#3E9B5A',
  bad: '#C0392B',
  disabled: '#A89A86',
  white: '#FFFFFF',
};

export const fonts = {
  title: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  body: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = { sm: 6, md: 12, lg: 18 };
/** Taille minimale des cibles tactiles (dp). */
export const TOUCH = 48;

export const SKIN_TONES = ['#FBD9BE', '#F1C27D', '#E0AC69', '#C68642', '#8D5524', '#5C3A1E'];
export const HAIR_COLORS = [
  '#2B1B10',
  '#5A3825',
  '#A0522D',
  '#E5C07B',
  '#D9622B',
  '#1F1F1F',
  '#8E8E8E',
  '#7A4FA0',
];

export function formatNumber(n: number): string {
  if (n < 1000) return String(Math.floor(n));
  const units = ['k', 'M', 'Md', 'T'];
  let u = -1;
  let v = n;
  while (v >= 1000 && u < units.length - 1) {
    v /= 1000;
    u++;
  }
  return `${v < 10 ? v.toFixed(1) : Math.floor(v)}${units[u]}`;
}

export function formatDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ${s % 60 ? `${s % 60} s` : ''}`.trim();
  const h = Math.floor(m / 60);
  return `${h} h ${m % 60} min`;
}
