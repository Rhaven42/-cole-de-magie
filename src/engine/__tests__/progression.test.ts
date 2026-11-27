import { CAREERS, YEARS } from '../../data/progression';
import {
  advanceYear,
  chooseCareer,
  coursesForYear,
  donationsPerMin,
  handleDonations,
} from '../progression';
import { courseReward, serviceTime } from '../modifiers';
import { addStudent, quietGame, run } from './helpers';
import { tick } from '../tick';
import type { GameEvent } from '../types';

describe('années, diplômes et métiers', () => {
  it('passe à l’année suivante après le nombre de cours requis, avec bonus', () => {
    const g = quietGame();
    const s = addStudent(g);
    const events: GameEvent[] = [];
    const coins = g.coins;
    for (let i = 0; i < coursesForYear(1); i++) advanceYear(g, s, events);
    expect(s.year).toBe(2);
    expect(s.yearPassed).toBe(0);
    expect(g.coins).toBe(coins + YEARS.yearUpBonus * 2);
    expect(events[0]).toMatchObject({ type: 'yearUp', year: 2 });
  });

  it('fin de 7e année : l’élève part passer l’examen final', () => {
    const g = quietGame(11);
    const s = addStudent(g, {
      year: 7,
      yearPassed: coursesForYear(7) - 1,
      passedBy: { defense: 9, potions: 3 },
    });
    expect(advanceYear(g, s, [])).toBe(false);
    expect(s.graduating).toBe(true);
    expect(g.students[s.id]).toBeDefined();
  });

  it('examen réussi : diplôme, réputation, métier, ancien élève', () => {
    const g = quietGame(11);
    const s = addStudent(g, {
      year: 7,
      graduating: true,
      house: 'pyrraxe',
      passedBy: { defense: 9, potions: 3 },
    });
    g.stations.reception.queue = [];
    g.coins = 1e9;
    expect(jest.requireActual('../actions').buyExam(g)).toBe(true);
    s.activity = { mode: 'free', since: 0 };
    const rep = g.reputation;
    tick(g);
    expect(s.activity).toMatchObject({ stationId: 'exam' });
    const events = run(g, 31);
    expect(g.students[s.id]).toBeUndefined();
    expect(g.totals.graduated).toBe(1);
    expect(g.meta.lifetimeGraduates).toBe(1);
    expect(g.careers.guardian).toBe(1);
    expect(g.alumni[0]).toMatchObject({ name: s.name, career: 'guardian' });
    expect(g.reputation).toBeGreaterThan(rep);
    expect(events.some((e) => e.type === 'graduated')).toBe(true);
  });

  it('choisit le métier de la matière la plus validée', () => {
    const g = quietGame();
    expect(chooseCareer(addStudent(g, { passedBy: { botany: 5, history: 2 } }))).toBe('herbalist');
    expect(chooseCareer(addStudent(g, { passedBy: {} }))).toBeDefined();
  });

  it('les anciens élèves envoient des dons', () => {
    const g = quietGame();
    g.careers = { guardian: 2, alchemist: 1 };
    expect(donationsPerMin(g)).toBe(
      2 * CAREERS.guardian.donationPerMin + CAREERS.alchemist.donationPerMin,
    );
    const coins = g.coins;
    handleDonations(g, 60);
    expect(g.coins).toBe(coins + donationsPerMin(g));
  });

  it('cours « Avancé » en 7e année : ×2 gains, ×1,5 durée', () => {
    const g = quietGame();
    const st = g.stations['course-potions'];
    const y1 = addStudent(g, { year: 1, house: 'pyrraxe', mood: 80 });
    const y7 = addStudent(g, { year: 7, house: 'pyrraxe', mood: 80 });
    expect(courseReward(st, y7)).toBe(courseReward(st, y1) * 2);
    expect(serviceTime(st, 0, y7)).toBeCloseTo(serviceTime(st, 0, y1) * 1.5);
  });

  it('un élève va surtout vers les matières qu’il n’a pas encore suivies', () => {
    const g = quietGame();
    g.coins = 1e7;
    const { buyCourse } = jest.requireActual('../actions');
    buyCourse(g, 'charms');
    const { chooseCourse } = jest.requireActual('../tick');
    const s = addStudent(g, { passedBy: { potions: 3 } });
    const picks = Array.from({ length: 30 }, () => chooseCourse(g, s)?.id);
    expect(picks.filter((x) => x === 'course-charms').length).toBeGreaterThan(20);
  });

  it('grade selon le nombre de matières suivies', () => {
    const { gradeOf } = jest.requireActual('../progression');
    expect(gradeOf({ passedBy: { potions: 5 } }).id).toBe('apprentice');
    expect(
      gradeOf({ passedBy: { potions: 1, botany: 1, history: 1, charms: 1, duel: 1 } }).id,
    ).toBe('adept');
  });

  it('a suivi toutes les matières sans Salle des Examens : il part', () => {
    const g = quietGame();
    const s = addStudent(g, { house: 'pyrraxe', passedBy: { potions: 1 } });
    g.stations.reception.queue = [];
    s.activity = { mode: 'free', since: 0 };
    const events = run(g, 0.25);
    expect(g.students[s.id]).toBeUndefined();
    expect(events.some((e) => e.type === 'left' && e.reason === 'done')).toBe(true);
  });

  it('attente trop longue devant une salle : il part', () => {
    const g = quietGame();
    const st = g.stations['course-potions'];
    const s = addStudent(g, { house: 'pyrraxe' });
    g.stations.reception.queue = [];
    st.seats[0].occupant = -1;
    st.seats[0].remaining = 1e9;
    st.queue.push(s.id);
    s.activity = { mode: 'queue', stationId: st.id, since: 0 };
    run(g, 200);
    expect(g.students[s.id]).toBeUndefined();
  });

  it('l’Accueil encaisse des frais d’inscription', () => {
    const g = quietGame();
    const before = g.coins;
    addStudent(g);
    run(g, 20);
    expect(g.coins).toBeGreaterThan(before);
  });
});

describe('grand repas', () => {
  it('toutes les 45 min, les élèves des cours mangent (faim remise à zéro)', () => {
    const { createGame } = jest.requireActual('../state');
    const { tick } = jest.requireActual('../tick');
    const { buyCourse } = jest.requireActual('../actions');
    const { MEAL_BREAK, isMealBreak } = jest.requireActual('../../data/progression');
    expect(MEAL_BREAK.every).toBe(45 * 60);
    const g = createGame(3, 0);
    g.coins = 1e6;
    buyCourse(g, 'botany');
    // Joue jusqu'à juste avant le repas, puis pendant le repas.
    while (!isMealBreak(g.time + 1)) tick(g, 1);
    const inCourses = () =>
      Object.values(g.stations)
        .filter((st: any) => st.kind === 'course')
        .flatMap((st: any) => [...st.queue, ...st.seats.map((x: any) => x.occupant)])
        .filter((id: any) => id !== null);
    expect(inCourses().length).toBeGreaterThan(0);
    for (const id of inCourses()) g.students[id].hunger = 80;
    tick(g, 2);
    for (const id of inCourses()) expect(g.students[id].hunger).toBe(0);
  });
});
