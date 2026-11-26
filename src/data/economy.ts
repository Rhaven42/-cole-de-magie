/** Économie globale (§9). Tout rééquilibrage passe par ce dossier. */
export const ECONOMY = {
  startCoins: 30,
  startGems: 5,
  /** Croissance du coût des niveaux de salle : base × growth^niveau. */
  levelGrowth: 1.55,
  maxLevel: 10,
  /** Croissance du prix des places supplémentaires. */
  seatGrowth: 1.45,
  /** Amélioration place par place (niveaux 1→5) : coût = prixUnitaire × base × growth^(niveau−1). */
  seatUpgrade: {
    maxLevel: 5,
    base: 4,
    growth: 2.1,
    timePerLevel: 0.05,
    failPerLevel: 0.02,
    /** Bonus d'Éclats par niveau de place (places de cours uniquement). */
    coinPerLevel: 0.05,
  },
  /** Évolution visuelle des objets : niveau à partir duquel l'objet change d'aspect. */
  seatTiers: { improved: 3, legendary: 5 },
  /** Effets d'un niveau de salle. */
  level: { timePerLevel: 0.04, coinPerLevel: 0.06, seatEveryLevels: 2 },
  /** Places maximum dans une salle de cours. */
  courseMaxSeats: 12,
  /** Prix d'une place supplémentaire de salle de cours = reward × ce facteur. */
  courseSeatPriceFactor: 9,
};

/** Flux d'élèves et Réputation. */
export const POPULATION = {
  /** Intervalle de base entre deux arrivées (s). */
  arrivalInterval: 7,
  /** Accélération des arrivées par point de réputation. */
  arrivalPerRep: 0.04,
  minArrivalInterval: 1.5,
  /** Population maximale = baseCap + lits × perBed + places de cours × perCourseSeat. */
  baseCap: 4,
  perBed: 2,
  perCourseSeat: 0.5,
  /** Patience à la file de l'Accueil (s). */
  receptionPatience: 45,
  /** Au Salon des Destinées, au-delà de cette attente l'humeur baisse (s). */
  sortingPatience: 30,
  sortingMoodLossPerSec: 0.5,
  /** Réputation. */
  repOnEnroll: 0.05,
  repOnLeave: -0.6,
  repOnCourse: 0.01,
  /** Paliers d'étoiles de Réputation. */
  starThresholds: [0, 5, 20, 60, 150, 400],
};

/** Besoins des élèves. */
export const NEEDS = {
  fatigueThreshold: 70,
  hungerThreshold: 60,
  /** Au-delà, l'élève apprend plus lentement et perd de l'humeur. */
  starvingHunger: 100,
  starvingTimeMult: 1.25,
  starvingMoodLoss: 4,
  startMood: 70,
  moodOnMeal: 10,
  moodOnSleep: 5,
  /** Sous ce seuil d'humeur, les gains sont réduits. */
  lowMood: 30,
  lowMoodCoinMult: 0.85,
};

/** IA de choix de cours : score = gain / (durée + attente estimée), ± aléa. */
export const COURSE_AI = { randomness: 0.15 };
