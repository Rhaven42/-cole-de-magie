/** Événements aléatoires (périodiques) et incidents (déclenchés par un échec). */
export type TimedEventId = 'banquet' | 'shootingStars' | 'ghost' | 'owl' | 'inspection';
export type IncidentId = 'explosion' | 'broomFall';
export type EventId = TimedEventId | IncidentId;

export interface EventDef {
  id: EventId;
  icon: string;
  /** Durée de l'effet (s), 0 = instantané. */
  duration: number;
  /** Poids de tirage pour les événements périodiques. */
  weight?: number;
}

export const EVENTS: Record<EventId, EventDef> = {
  banquet: { id: 'banquet', icon: '🍗', duration: 60, weight: 3 },
  shootingStars: { id: 'shootingStars', icon: '🌠', duration: 60, weight: 3 },
  ghost: { id: 'ghost', icon: '👻', duration: 20, weight: 2 },
  owl: { id: 'owl', icon: '🦉', duration: 0, weight: 2 },
  inspection: { id: 'inspection', icon: '🧐', duration: 0, weight: 2 },
  explosion: { id: 'explosion', icon: '💥', duration: 10 },
  broomFall: { id: 'broomFall', icon: '🤕', duration: 0 },
};

export const TIMED_EVENTS: TimedEventId[] = [
  'banquet',
  'shootingStars',
  'ghost',
  'owl',
  'inspection',
];

export const EVENT_RULES = {
  /** Intervalle entre deux événements périodiques (s). */
  minInterval: 150,
  maxInterval: 300,
  /** Banquet : repas 2× plus rapides, humeur +, bonus d'Éclats par élève. */
  banquetHallTimeMult: 0.5,
  banquetMood: 10,
  banquetCoinsPerStudent: 5,
  /** Étoiles filantes : Astronomie et Divination rapportent ×2. */
  shootingStarsMult: 2,
  /** Fantôme farceur : humeur −10 pour les élèves d'une salle. */
  ghostMood: -10,
  /** Hibou messager : gemmes. */
  owlGems: 1,
  /** Inspection : réputation selon la file de l'Accueil. */
  inspectionGood: 3,
  inspectionBad: -1,
  inspectionMaxQueue: 3,
  /** Explosion de chaudron après un échec en Potions : la salle s'arrête. */
  explosionChance: 0.35,
  /** Chute de balai après un échec en Balais volants : fatigue +. */
  broomFallFatigue: 30,
};
