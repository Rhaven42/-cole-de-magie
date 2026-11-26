import { createGame, SCHEMA_VERSION } from '../state';
import { deserialize, serialize } from '../save';
import { catchUp, elapsedSince, OFFLINE_MAX_SECONDS } from '../offline';
import { tick } from '../tick';

describe('sauvegarde', () => {
  it('aller-retour sans perte', () => {
    const g = createGame(9);
    for (let i = 0; i < 400; i++) tick(g);
    const back = deserialize(serialize(g))!;
    expect(back).toEqual(g);
  });

  it('rejette les sauvegardes illisibles ou futures', () => {
    expect(deserialize('{pas du json')).toBeNull();
    expect(deserialize('null')).toBeNull();
    expect(deserialize('{"foo":1}')).toBeNull();
    expect(deserialize(JSON.stringify({ schemaVersion: SCHEMA_VERSION + 1 }))).toBeNull();
  });

  it('applique les migrations dans l’ordre', () => {
    const old = { schemaVersion: 0, coins: 5 };
    const migrated = deserialize(
      JSON.stringify(old),
      { 0: (r) => ({ ...r, gems: 3, schemaVersion: 1 }) },
      1,
    );
    expect(migrated).toMatchObject({ coins: 5, gems: 3, schemaVersion: 1 });
    expect(deserialize(JSON.stringify(old), {}, 1)).toBeNull();
  });
});

describe('hors-ligne', () => {
  it('calcule le temps écoulé, plafonné à 8 h', () => {
    const g = createGame(1, 1_000_000);
    expect(elapsedSince(g, 1_000_000 + 60_000)).toBe(60);
    expect(elapsedSince(g, 1_000_000 + 100 * 3600_000)).toBe(OFFLINE_MAX_SECONDS);
  });

  it('anti-triche : une horloge qui recule ne donne rien', () => {
    const g = createGame(1, 1_000_000);
    expect(elapsedSince(g, 500_000)).toBe(0);
    expect(elapsedSince(g, NaN)).toBe(0);
  });

  it('rattrape la progression et résume', () => {
    const g = createGame(2);
    const sum = catchUp(g, 600);
    expect(sum.seconds).toBe(600);
    expect(sum.arrived).toBeGreaterThan(0);
    expect(sum.courses).toBeGreaterThan(0);
    expect(sum.coins).toBeGreaterThan(0);
    expect(g.time).toBeCloseTo(600);
  });
});

describe('déterminisme', () => {
  it('même graine → même partie', () => {
    const a = createGame(77);
    const b = createGame(77);
    for (let i = 0; i < 2000; i++) {
      tick(a);
      tick(b);
    }
    expect(serialize(a)).toBe(serialize(b));
  });
});

describe('migration v1 → v2', () => {
  it('ajoute les nouveaux champs sans perdre la partie', () => {
    const v1 = JSON.parse(serialize(createGame(4)));
    v1.schemaVersion = 1;
    for (const k of [
      'managers',
      'careers',
      'alumni',
      'events',
      'nextEventAt',
      'donationAcc',
      'meta',
    ])
      delete v1[k];
    for (const st of Object.values(v1.stations) as Record<string, unknown>[]) {
      delete st.pending;
      delete st.closedUntil;
    }
    v1.coins = 1234;
    v1.students = { 1: { id: 1, name: 'Test', activity: { mode: 'free', since: 0 } } };
    const g = deserialize(JSON.stringify(v1))!;
    expect(g.schemaVersion).toBe(2);
    expect(g.coins).toBe(1234);
    expect(g.meta.prestige).toBe(0);
    expect(g.stations.reception.pending).toBe(0);
    expect(g.students[1].passedBy).toEqual({});
    for (let i = 0; i < 100; i++) tick(g);
  });
});
