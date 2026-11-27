/**
 * Réglages modifiables depuis l'interface d'administration (sans toucher au code).
 * Chaque réglage pointe vers une valeur des fichiers de données ; les valeurs
 * modifiées sont enregistrées sur l'appareil et ré-appliquées au lancement.
 */
import { ADS } from './ads';
import { COURSE_IDS, COURSES } from './courses';
import { ECONOMY, POPULATION } from './economy';
import { GEM_BONUS, GEM_ITEMS, OFFLINE_BASE, TREE } from './gemShop';
import { HOUSE_CUP } from './houses';
import { PROF_UPGRADE } from './professors';
import { ENROLLMENT, GRADUATION, MEAL_BREAK, RULES } from './progression';
import { DORM_PURCHASE } from './stations';
import { t } from '../i18n';

/** Code d'accès à l'administration (Réglages → Administration). */
export const ADMIN_CODE = '4242';

export interface Param {
  id: string;
  group: string;
  label: string;
  unit?: string;
  obj: Record<string, unknown>;
  key: string;
}

const P = (
  group: string,
  id: string,
  label: string,
  obj: object,
  key: string,
  unit?: string,
): Param => ({ id, group, label, obj: obj as Record<string, unknown>, key, unit });

export const PARAMS: Param[] = [
  P('💰 Économie', 'eco.startCoins', 'Éclats au départ', ECONOMY, 'startCoins'),
  P('💰 Économie', 'eco.startGems', 'Diamants au départ', ECONOMY, 'startGems'),
  P('💰 Économie', 'eco.seatGrowth', 'Hausse du prix des places (×)', ECONOMY, 'seatGrowth'),
  P('💰 Économie', 'eco.levelGrowth', 'Hausse du prix des niveaux (×)', ECONOMY, 'levelGrowth'),
  P('💰 Économie', 'eco.maxLevel', 'Niveau max des salles', ECONOMY, 'maxLevel'),
  P(
    '💰 Économie',
    'eco.seatFactor',
    'Prix d’une place (× gain du cours)',
    ECONOMY,
    'courseSeatPriceFactor',
  ),
  P('💰 Économie', 'eco.maxSeats', 'Places max par salle', ECONOMY, 'courseMaxSeats'),
  P('🪑 Objets', 'seat.max', 'Niveau max des objets', ECONOMY.seatUpgrade, 'maxLevel'),
  P('🪑 Objets', 'seat.base', 'Prix de base (× gain du cours)', ECONOMY.seatUpgrade, 'base'),
  P('🪑 Objets', 'seat.growth', 'Hausse du prix par niveau (×)', ECONOMY.seatUpgrade, 'growth'),
  P(
    '🪑 Objets',
    'seat.time',
    'Durée en moins par niveau (0,012 = 1,2 %)',
    ECONOMY.seatUpgrade,
    'timePerLevel',
  ),
  P(
    '🪑 Objets',
    'seat.coin',
    'Gains en plus par niveau (0,03 = 3 %)',
    ECONOMY.seatUpgrade,
    'coinPerLevel',
  ),
  P('🪑 Objets', 'seat.tier1', 'Nouveau look au niveau', ECONOMY.seatTiers, 'improved'),
  P('🪑 Objets', 'seat.tier2', 'Look légendaire au niveau', ECONOMY.seatTiers, 'legendary'),
  P('💰 Économie', 'enr.fee', 'Frais d’inscription', ENROLLMENT, 'fee', 'Éclats'),
  P('💰 Économie', 'grad.coins', 'Prime de diplôme', GRADUATION, 'coins', 'Éclats'),
  P('💰 Économie', 'rules.exam', 'Prix de la Salle des Examens', RULES, 'examPrice', 'Éclats'),
  P('💰 Économie', 'dorm.base', 'Prix du 1er dortoir', DORM_PURCHASE, 'base', 'Éclats'),
  P('💰 Économie', 'dorm.growth', 'Hausse du prix des dortoirs (×)', DORM_PURCHASE, 'growth'),
  P('🎒 Élèves', 'pop.arrival', 'Délai entre deux arrivées', POPULATION, 'arrivalInterval', 's'),
  P('🎒 Élèves', 'pop.baseCap', 'Élèves max de base', POPULATION, 'baseCap'),
  P('🎒 Élèves', 'pop.perBed', 'Élèves en plus par lit', POPULATION, 'perBed'),
  P('🎒 Élèves', 'pop.recPatience', 'Patience à l’Accueil', POPULATION, 'receptionPatience', 's'),
  P('🎒 Élèves', 'rules.patience', 'Patience devant un cours', RULES, 'coursePatience', 's'),
  P('🍽️ Cantine', 'meal.every', 'Pause repas toutes les', MEAL_BREAK, 'every', 's'),
  P('🍽️ Cantine', 'meal.duration', 'Durée de la pause repas', MEAL_BREAK, 'duration', 's'),
  P('👩‍🏫 Profs', 'prof.max', 'Niveau max des profs', PROF_UPGRADE, 'maxLevel'),
  P('👩‍🏫 Profs', 'prof.base', 'Prix de base', PROF_UPGRADE, 'base', 'Éclats'),
  P('👩‍🏫 Profs', 'prof.growth', 'Hausse du prix (×)', PROF_UPGRADE, 'growth'),
  P(
    '👩‍🏫 Profs',
    'prof.time',
    'Cours plus court par niveau (0,04 = 4 %)',
    PROF_UPGRADE,
    'timePerLevel',
  ),
  P('👩‍🏫 Profs', 'prof.coin', 'Gains en plus par niveau (0,06 = 6 %)', PROF_UPGRADE, 'coinPerLevel'),
  P('🏆 Maisons', 'cup.season', 'Durée d’une saison', HOUSE_CUP, 'seasonSeconds', 's'),
  P('🏆 Maisons', 'cup.gems', 'Diamants par saison', HOUSE_CUP, 'seasonGems'),
  P('🎁 Pubs', 'ads.first', 'Première offre après', ADS, 'firstAt', 's'),
  P('🎁 Pubs', 'ads.cooldown', 'Délai entre deux offres', ADS, 'cooldown', 's'),
  P('🎁 Pubs', 'ads.double', 'Durée du ×2', ADS, 'doubleSeconds', 's'),
  P('🎁 Pubs', 'ads.coinsMin', 'Bourse : minutes de gains', ADS, 'coinsMinutes', 'min'),
  P('🎁 Pubs', 'ads.gems', 'Diamants par pub', ADS, 'gems'),
  P('🎁 Pubs', 'ads.video', 'Durée de la vidéo simulée', ADS, 'videoSeconds', 's'),
  P('🌳 Arbre enchanté', 'tree.every', 'Un fruit toutes les', TREE, 'every', 's'),
  P('🌳 Arbre enchanté', 'tree.minutes', 'Fruit : minutes de gains', TREE, 'coinsMinutes', 'min'),
  P('🌳 Arbre enchanté', 'tree.min', 'Fruit : minimum', TREE, 'coinsMin', 'Éclats'),
  P('🌳 Arbre enchanté', 'tree.gems', 'Diamants avec la pub', TREE, 'adGems'),
  P('🌙 Hors-ligne', 'off.base', 'Plafond de base', OFFLINE_BASE, 'seconds', 's'),
  P('🌙 Hors-ligne', 'off.per', 'En plus par Veilleuse', OFFLINE_BASE, 'perLevel', 's'),
  P(
    '💎 Boutique',
    'gb.philo',
    'Pierre philosophale : gains (0,25 = 25 %)',
    GEM_BONUS,
    'philosopherCoin',
  ),
  P('💎 Boutique', 'gb.chrono', 'Sablier : temps en moins (0,08 = 8 %)', GEM_BONUS, 'chronoTime'),
  P('💎 Boutique', 'gb.fortune', 'Potion de Fortune : durée', GEM_BONUS, 'fortuneSeconds', 's'),
  P('💎 Boutique', 'gb.treasure', 'Coffre : minutes de gains', GEM_BONUS, 'treasureMinutes', 'min'),
  ...GEM_ITEMS.flatMap((it) => [
    P('💎 Boutique', `gem.${it.id}.cost`, `${it.name} : prix`, it, 'cost', '💎'),
    ...(it.max > 0
      ? [P('💎 Boutique', `gem.${it.id}.step`, `${it.name} : + par niveau`, it, 'costStep', '💎')]
      : []),
  ]),
  ...COURSE_IDS.flatMap((id) => [
    P(
      '📚 Cours',
      `course.${id}.price`,
      `${COURSES[id].icon} ${t(`course.${id}`)} : prix`,
      COURSES[id],
      'price',
      'Éclats',
    ),
    P(
      '📚 Cours',
      `course.${id}.reward`,
      `${COURSES[id].icon} ${t(`course.${id}`)} : gain`,
      COURSES[id],
      'reward',
      'Éclats',
    ),
    P(
      '📚 Cours',
      `course.${id}.duration`,
      `${COURSES[id].icon} ${t(`course.${id}`)} : durée`,
      COURSES[id],
      'duration',
      's',
    ),
  ]),
];

/** Valeurs d'origine (avant toute modification). */
export const DEFAULTS: Record<string, number> = Object.fromEntries(
  PARAMS.map((p) => [p.id, p.obj[p.key] as number]),
);

const byId = new Map(PARAMS.map((p) => [p.id, p]));

export function paramValue(id: string): number {
  const p = byId.get(id);
  return p ? (p.obj[p.key] as number) : NaN;
}

/** Applique des valeurs modifiées (les autres reprennent leur valeur d'origine). */
export function applyTuning(overrides: Record<string, number>): void {
  for (const p of PARAMS) {
    const v = overrides[p.id];
    p.obj[p.key] = typeof v === 'number' && Number.isFinite(v) ? v : DEFAULTS[p.id];
  }
}
