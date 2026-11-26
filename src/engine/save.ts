import { SCHEMA_VERSION } from './state';
import type { GameState } from './types';

/** Migrations de schéma : version N → N+1. Ne jamais casser une sauvegarde. */
type Migration = (raw: any) => any;
export const MIGRATIONS: Record<number, Migration> = {
  /** v1 → v2 : années, métiers, événements, coffres, managers, méta (prestige, reliques, quotidien). */
  1: (raw) => {
    for (const st of Object.values(raw.stations ?? {}) as any[]) {
      st.pending = 0;
      st.closedUntil = 0;
      st.stats = { earned: 0, ...st.stats };
    }
    for (const s of Object.values(raw.students ?? {}) as any[]) {
      s.yearPassed = s.yearPassed ?? 0;
      s.passedBy = s.passedBy ?? {};
    }
    return {
      ...raw,
      totals: { graduated: 0, yearUps: 0, ...raw.totals },
      managers: {},
      careers: {},
      alumni: [],
      events: [],
      nextEventAt: (raw.time ?? 0) + 150,
      donationAcc: 0,
      meta: {
        prestige: 0,
        env: 0,
        relics: {},
        dailyDay: null,
        dailyStreak: 0,
        lifetimeGraduates: 0,
      },
      schemaVersion: 2,
    };
  },
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
