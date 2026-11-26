import { COURSES } from '../../data/courses';
import { NEEDS } from '../../data/economy';
import { chooseCourse, tick } from '../tick';
import { buyCourse } from '../actions';
import { addStudent, quietGame, run } from './helpers';
import type { GameState, Student } from '../types';

function freeSorted(g: GameState, patch: Partial<Student> = {}): Student {
  const s = addStudent(g, { house: 'sylvaine', fatigue: 0, hunger: 0, ...patch });
  g.stations.reception.queue = [];
  s.activity = { mode: 'free', since: g.time };
  return s;
}

describe('cycle de vie des élèves', () => {
  it('un élève libre va en cours, valide, gagne des Éclats', () => {
    const g = quietGame();
    const s = freeSorted(g, { mood: 80 });
    const coins = g.coins;
    const events = run(g, 21);
    const coinEv = events.find((e) => e.type === 'coins' || e.type === 'fail');
    expect(coinEv).toBeDefined();
    expect(s.fatigue).toBeGreaterThan(0);
    expect(s.hunger).toBeGreaterThan(0);
    if (coinEv!.type === 'coins') {
      // Sylvaine : +8 % → 10 × 1.08 ≈ 11
      expect(coinEv!.amount).toBe(11);
      expect(g.coins).toBe(coins + 11);
      expect(g.cup.points.sylvaine).toBe(10);
    }
  });

  it('un élève fatigué va au dortoir et se repose', () => {
    const g = quietGame();
    const s = freeSorted(g, { fatigue: NEEDS.fatigueThreshold });
    tick(g);
    expect(s.activity).toMatchObject({ mode: 'seat', stationId: 'dorm-0' });
    run(g, 41);
    expect(s.fatigue).toBe(0);
  });

  it('un élève affamé va à la Grande Salle', () => {
    const g = quietGame();
    const s = freeSorted(g, { hunger: NEEDS.hungerThreshold, mood: 50 });
    tick(g);
    expect(s.activity).toMatchObject({ stationId: 'hall' });
    run(g, 16);
    expect(s.hunger).toBe(0);
    expect(s.mood).toBeGreaterThan(50);
  });

  it('la fatigue est prioritaire sur la faim', () => {
    const g = quietGame();
    const s = freeSorted(g, { hunger: 90, fatigue: 90 });
    tick(g);
    expect(s.activity).toMatchObject({ stationId: 'dorm-0' });
  });

  it('un élève très affamé apprend plus lentement', () => {
    const g = quietGame();
    const s = freeSorted(g, { hunger: 120, fatigue: 0 });
    // forcé en cours pour le test
    const st = g.stations['course-potions'];
    st.queue.push(s.id);
    s.activity = { mode: 'queue', stationId: st.id, since: g.time };
    tick(g);
    expect(st.seats[0].total).toBeCloseTo(25);
  });

  it('choisit le cours avec la meilleure rentabilité compte tenu des files', () => {
    const g = quietGame();
    g.coins = 1e6;
    buyCourse(g, 'botany');
    const s = freeSorted(g);
    // Potions saturé : longue file
    g.stations['course-potions'].queue = Array.from({ length: 30 }, (_, i) => 1000 + i);
    g.stations['course-potions'].seats.forEach((x) => (x.occupant = 999));
    expect(chooseCourse(g, s)?.id).toBe('course-botany');
  });

  it('un cours raté ne rapporte rien mais donne un peu d’XP', () => {
    const g = quietGame();
    const s = freeSorted(g);
    const st = g.stations['course-potions'];
    // force l’échec
    COURSES.potions.failRate = 1;
    const events = run(g, 21);
    COURSES.potions.failRate = 0.12;
    expect(events.some((e) => e.type === 'fail')).toBe(true);
    expect(s.xp).toBe(3);
    expect(g.totals.coursesFailed).toBe(1);
    expect(st.stats.served).toBe(1);
  });

  it('une faible humeur réduit les gains', () => {
    const g = quietGame();
    freeSorted(g, { mood: 10, house: 'pyrraxe' });
    COURSES.potions.failRate = 0;
    const events = run(g, 21);
    COURSES.potions.failRate = 0.12;
    const ev = events.find((e) => e.type === 'coins');
    expect(ev && ev.type === 'coins' && ev.amount).toBe(9);
  });
});
