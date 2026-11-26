import { SCHEMA_VERSION } from './state';
import type { GameState } from './types';

/** Migrations de schéma : version N → N+1. Ne jamais casser une sauvegarde. */
type Migration = (raw: any) => any;
export const MIGRATIONS: Record<number, Migration> = {
  // 1: (raw) => ({ ...raw, nouveauChamp: valeurParDéfaut, schemaVersion: 2 }),
};

export function serialize(state: GameState): string {
  return JSON.stringify(state);
}

/** Désérialise et migre. Renvoie null si la sauvegarde est illisible. */
export function deserialize(
  json: string,
  migrations: Record<number, Migration> = MIGRATIONS,
  target = SCHEMA_VERSION,
): GameState | null {
  let raw: any;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== 'object' || typeof raw.schemaVersion !== 'number') return null;
  while (raw.schemaVersion < target) {
    const m: Migration | undefined = migrations[raw.schemaVersion];
    if (!m) return null;
    raw = m(raw);
  }
  if (raw.schemaVersion > target) return null;
  return raw as GameState;
}
