import { HOUSE_CUP, HOUSE_IDS } from '../../data/houses';
import { chooseHouse } from '../tick';
import { addStudent, quietGame, run } from './helpers';

describe('Maisons & Chapeau Songeur', () => {
  it('répartit un élève après 10 s au Salon', () => {
    const g = quietGame();
    const s = addStudent(g);
    const events = run(g, 8.5 + 10.25);
    expect(s.house).not.toBeNull();
    const ev = events.find((e) => e.type === 'sorted');
    expect(ev).toMatchObject({ studentId: s.id });
    expect(g.totals.sorted).toBe(1);
  });

  it('répartition à peu près équilibrée sur 400 élèves', () => {
    const g = quietGame(7);
    const counts: Record<string, number> = {};
    for (let i = 0; i < 400; i++) {
      const s = addStudent(g);
      s.house = chooseHouse(g, s);
      counts[s.house] = (counts[s.house] ?? 0) + 1;
    }
    for (const h of HOUSE_IDS) {
      expect(counts[h]).toBeGreaterThan(70);
      expect(counts[h]).toBeLessThan(130);
    }
  });

  it('les traits influencent la Maison', () => {
    const g = quietGame(3);
    let brave = 0;
    for (let i = 0; i < 200; i++) {
      const s = addStudent(g, { trait: 'brave' });
      if (chooseHouse(g, s) === 'pyrraxe') brave++;
      delete g.students[s.id];
    }
    expect(brave).toBeGreaterThan(70); // ≫ 25 %
  });

  it('l’orientation (niveau 5) favorise la Maison choisie', () => {
    const g = quietGame(5);
    g.stations.sorting.level = 5;
    g.sortingBias = 'azurea';
    let n = 0;
    for (let i = 0; i < 200; i++) {
      const s = addStudent(g, { trait: 'brave' });
      if (chooseHouse(g, s) === 'azurea') n++;
      delete g.students[s.id];
    }
    expect(n).toBeGreaterThan(60);
  });

  it('fin de saison de la Coupe : récompense et remise à zéro', () => {
    const g = quietGame();
    const s = addStudent(g, { house: 'aurelis' });
    s.activity = { mode: 'free', since: 0 };
    g.stations.reception.queue = [];
    g.cup.points.aurelis = 50;
    const coins = g.coins;
    const gems = g.gems;
    g.time = HOUSE_CUP.seasonSeconds;
    const events = run(g, 0.25);
    expect(events.find((e) => e.type === 'cupWon')).toMatchObject({ house: 'aurelis' });
    expect(g.coins).toBeGreaterThanOrEqual(coins + HOUSE_CUP.winnerCoinsPerStudent);
    expect(g.gems).toBe(gems + 1);
    expect(g.cup.season).toBe(2);
    expect(g.cup.points.aurelis).toBe(0);
    expect(g.cup.lastWinner).toBe('aurelis');
  });

  it('pas de gagnante si aucun point', () => {
    const g = quietGame();
    g.time = HOUSE_CUP.seasonSeconds;
    run(g, 0.25);
    expect(g.cup.lastWinner).toBeNull();
    expect(g.cup.season).toBe(2);
  });
});
