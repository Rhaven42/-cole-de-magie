import { applyTuning, DEFAULTS, paramValue } from '../../data/tuning';
import { TREE } from '../../data/gemShop';
import { ECONOMY } from '../../data/economy';
import { buyGemItem, gemItemCost, harvestTree, offlineCap, treeWait } from '../gemShop';
import { elapsedSince } from '../offline';
import { gemCoinMult, gemTimeMult, metaMult } from '../modifiers';
import { createGame } from '../state';

describe('Arbre enchanté', () => {
  it('donne un fruit, puis repousse une heure plus tard', () => {
    const g = createGame(1, 0);
    const now = 1_000_000;
    expect(treeWait(g, now)).toBe(0);
    const coins = g.coins;
    expect(harvestTree(g, now, false)).toBe(true);
    expect(g.coins).toBeGreaterThanOrEqual(coins + TREE.coinsMin);
    expect(treeWait(g, now)).toBe(TREE.every);
    expect(harvestTree(g, now + 1000, false)).toBe(false);
    const gems = g.gems;
    expect(harvestTree(g, now + TREE.every * 1000, true)).toBe(true);
    expect(g.gems).toBe(gems + TREE.adGems);
  });
});

describe('Boutique de Diamants', () => {
  it('améliorations permanentes avec prix croissant et niveau max', () => {
    const g = createGame(1, 0);
    g.gems = 10_000;
    const c1 = gemItemCost(g, 'philosopher')!;
    const base = metaMult(g);
    expect(buyGemItem(g, 'philosopher')).toBe(true);
    expect(gemItemCost(g, 'philosopher')!).toBeGreaterThan(c1);
    expect(gemCoinMult(g)).toBeCloseTo(1.25);
    expect(metaMult(g)).toBeCloseTo(base * 1.25);
    for (let i = 0; i < 10; i++) buyGemItem(g, 'philosopher');
    expect(g.gemShop?.philosopher).toBe(5);
    expect(gemItemCost(g, 'philosopher')).toBeNull();
    buyGemItem(g, 'chrono');
    expect(gemTimeMult(g)).toBeCloseTo(0.92);
  });

  it('refuse sans assez de Diamants', () => {
    const g = createGame(1, 0);
    g.gems = 0;
    expect(buyGemItem(g, 'treasure')).toBe(false);
  });

  it('la Veilleuse allonge le plafond hors-ligne', () => {
    const g = createGame(1, 0);
    g.lastSavedAt = 0;
    expect(elapsedSince(g, 100 * 3600 * 1000)).toBe(2 * 3600);
    g.gems = 1000;
    buyGemItem(g, 'hourglass');
    expect(offlineCap(g)).toBe(4 * 3600);
    expect(elapsedSince(g, 100 * 3600 * 1000)).toBe(4 * 3600);
  });

  it('Potion et Coffre sont rachetables', () => {
    const g = createGame(1, 0);
    g.gems = 1000;
    expect(buyGemItem(g, 'fortune')).toBe(true);
    expect(g.boostUntil).toBeGreaterThan(g.time + 1000);
    const c = g.coins;
    expect(buyGemItem(g, 'treasure')).toBe(true);
    expect(buyGemItem(g, 'treasure')).toBe(true);
    expect(g.coins).toBeGreaterThan(c);
  });
});

describe('Réglages administrateur', () => {
  afterEach(() => applyTuning({}));
  it('applique puis rétablit les valeurs', () => {
    applyTuning({ 'eco.startCoins': 999, 'tree.every': 60 });
    expect(ECONOMY.startCoins).toBe(999);
    expect(paramValue('tree.every')).toBe(60);
    expect(createGame(1, 0).coins).toBe(999);
    applyTuning({});
    expect(ECONOMY.startCoins).toBe(DEFAULTS['eco.startCoins']);
  });
});
