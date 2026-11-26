/**
 * Professeur·es nommé·es par la directrice du projet.
 * Le recrutement complet (candidats, salaires, qualités/défauts) arrive au J5 ;
 * ces noms seront repris comme professeur·es titulaires.
 * `null` = nom en attente.
 */
import type { CourseId } from './courses';

export interface ProfessorName {
  firstName: string | null;
  lastName: string | null;
  gender?: 'f' | 'm';
}

export const NAMED_PROFESSORS: Partial<Record<CourseId, ProfessorName>> = {
  defense: { firstName: 'Harvald', lastName: null, gender: 'm' },
  charms: { firstName: 'Taladon', lastName: 'Morvard', gender: 'm' },
  transfiguration: { firstName: 'Tenarius', lastName: 'D’Arvay', gender: 'm' },
  potions: { firstName: null, lastName: 'Dolohov' },
  botany: { firstName: 'Solomon', lastName: 'Tregahl', gender: 'm' },
  flying: { firstName: 'Alva', lastName: null, gender: 'f' },
  divination: { firstName: null, lastName: null },
  duel: { firstName: 'Delan', lastName: 'Lanatre', gender: 'm' },
};

export function professorLabel(p: ProfessorName): string {
  const name = [p.firstName, p.lastName].filter(Boolean).join(' ');
  return name || 'Nom à venir';
}

export function professorTitle(p: ProfessorName): string {
  return p.gender === 'f' ? 'Professeure' : 'Professeur';
}
