import { CAREERS, YEARS } from '../../data/progression';
import {
  advanceYear,
  chooseCareer,
  coursesForYear,
  donationsPerMin,
  handleDonations,
} from '../progression';
import { courseReward, serviceTime } from '../modifiers';
import { addStudent, quietGame } from './helpers';
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

  it('diplôme en fin de 7e année : bonus, réputation, métier, ancien élève', () => {
    const g = quietGame(11);
    const s = addStudent(g, {
      year: 7,
      yearPassed: coursesForYear(7) - 1,
      passedBy: { defense: 9, potions: 3 },
    });
    const events: GameEvent[] = [];
    const rep = g.reputation;
    expect(advanceYear(g, s, events)).toBe(true);
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

  it('un élève ne va qu’aux cours de son année', () => {
    const g = quietGame();
    g.coins = 1e7;
    const { buyCourse } = jest.requireActual('../actions');
    buyCourse(g, 'defense');
    const { chooseCourse } = jest.requireActual('../tick');
    for (let i = 0; i < 20; i++)
      expect(chooseCourse(g, addStudent(g, { year: 1 }))?.id).toBe('course-potions');
    const vet = addStudent(g, { year: 6 });
    const picks = new Set(Array.from({ length: 30 }, () => chooseCourse(g, vet)?.id));
    expect(picks.has('course-defense')).toBe(true);
  });
});
