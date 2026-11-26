import { createGame } from '../state';
import { spawnStudent, tick } from '../tick';
import type { GameState, Student } from '../types';

/** Partie sans arrivées automatiques (intervalle infini). */
export function quietGame(seed = 42): GameState {
  const g = createGame(seed);
  g.arrivalTimer = -1e9;
  return g;
}

export function addStudent(g: GameState, patch: Partial<Student> = {}): Student {
  const s = spawnStudent(g, []);
  Object.assign(s, patch);
  return s;
}

export function run(g: GameState, seconds: number, dt = 0.25) {
  const events = [];
  for (let t = 0; t < seconds; t += dt) events.push(...tick(g, dt));
  return events;
}
