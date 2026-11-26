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
  /** Titre ou surnom (ex. « le Chevalier du Sinople »). */
  title?: string;
  gender?: 'f' | 'm';
}

export const NAMED_PROFESSORS: Partial<Record<CourseId, ProfessorName>> = {
  defense: { firstName: 'Harvald', lastName: 'Brennoch', gender: 'm' },
  charms: { firstName: 'Taladon', lastName: 'Morvard', gender: 'm' },
  transfiguration: { firstName: 'Tenarius', lastName: 'D’Arvay', gender: 'm' },
  potions: { firstName: 'Corvin', lastName: 'Dolmar', gender: 'm' },
  botany: { firstName: 'Solomon', lastName: 'Tregahl', gender: 'm' },
  astronomy: { firstName: 'Alva Ilan', lastName: 'Arsolle', gender: 'f' },
  divination: { firstName: 'Rhaven', lastName: 'Morvard', gender: 'f' },
  history: { firstName: 'Morgenvar', lastName: 'Kaldrec', gender: 'm' },
  duel: { firstName: 'Delan', lastName: 'Lanatre', title: 'le Chevalier du Sinople', gender: 'm' },
  flying: { firstName: 'Harwen', lastName: 'Malkin' },
};

export function professorLabel(p: ProfessorName): string {
  const name = [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Nom à venir';
  return p.title ? `${name}, ${p.title}` : name;
}

export function professorTitle(p: ProfessorName): string {
  return p.gender === 'f' ? 'Professeure' : 'Professeur';
}
