/**
 * Professeur·es nommé·es par la directrice du projet.
 * Le recrutement complet (candidats, salaires, qualités/défauts) arrive au J5 ;
 * ces noms seront repris comme professeur·es titulaires.
 */
import type { CourseId } from './courses';

export interface ProfessorName {
  firstName: string;
  /** Nom de famille : en attente. */
  lastName: string | null;
}

export const NAMED_PROFESSORS: Partial<Record<CourseId, ProfessorName>> = {
  defense: { firstName: 'Harvald', lastName: null },
};

export function professorLabel(p: ProfessorName): string {
  return p.lastName ? `${p.firstName} ${p.lastName}` : p.firstName;
}
