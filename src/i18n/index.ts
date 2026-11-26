import { fr, type TKey } from './fr';

const dictionaries = { fr } as const;
export type Locale = keyof typeof dictionaries;

let locale: Locale = 'fr';

export function setLocale(l: Locale): void {
  locale = l;
}

/** Traduit une clé avec paramètres `{nom}`. Clé inconnue → la clé elle-même. */
export function t(key: TKey | string, params?: Record<string, string | number>): string {
  const dict = dictionaries[locale] as Record<string, string>;
  let s = dict[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}

export { HAT_LINES_FR } from './fr';
