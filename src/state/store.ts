import { GRADES } from '../data/progression';
import * as Haptics from 'expo-haptics';
import { create } from 'zustand';
import {
  applyPurchase,
  buyCourse,
  buyDorm,
  buyExam,
  upgradeProf,
  upgradeSpeed,
  claimAd,
  harvestTree,
  buyGemItem,
  offlineCap,
  dismissAd,
  catchUp,
  createGame,
  elapsedSince,
  levelUp,
  addSeat,
  upgradeSeat,
  upgradeSeatMany,
  seatTier,
  upgradeTrack,
  buyProp,
  setSortingBias,
  tick,
  collect,
  collectAll,
  hireManager,
  moveSeat,
  claimDaily,
  canClaimDaily,
  dayNumber,
  prestige,
  TICK_SECONDS,
  type GameEvent,
  type GameState,
  type OfflineSummary,
  type Purchase,
} from '../engine';
import type { CourseId } from '../data/courses';
import type { GemItemId } from '../data/gemShop';
import type { HouseId } from '../data/houses';
import { clearSave, loadDecor, loadSave, loadTuning, writeDecor, writeSave } from './persistence';
import { getDecorEdits, setDecorEdits } from '../data/decorEdits';
import { applyTuning } from '../data/tuning';
import { seatSpot } from '../ui/iso';
import { t } from '../i18n';
import { EVENTS } from '../data/events';

export interface Floater {
  key: number;
  stationId: string;
  text: string;
  color: string;
  born: number;
}

export interface Toast {
  key: number;
  kind: 'sorted' | 'left' | 'cup' | 'graduated' | 'event' | 'relic';
  icon?: string;
  house?: HouseId;
  title: string;
  line?: number;
  born: number;
}

export interface EditorState {
  on: boolean;
  /** Objet sélectionné (« zone|clé » de DECOR_INDEX). */
  sel: string | null;
  /** Prochain toucher sur la carte : déplacer l'objet, ou poser un nouvel objet. */
  placing: null | { mode: 'move' } | { mode: 'add'; sprite: string };
}

interface Store {
  game: GameState;
  /** Incrémenté à chaque tick : les écrans s'y abonnent pour se redessiner. */
  rev: number;
  ready: boolean;
  speed: number;
  haptics: boolean;
  floaters: Floater[];
  toasts: Toast[];
  offline: OfflineSummary | null;
  /** Élève dont la fiche est ouverte. */
  student: number | null;
  selectStudent(id: number | null): void;
  /** Échantillons pour l'écran Rapport (toutes les 5 s, 1 min glissante). */
  history: { at: number; total: number; byStation: Record<string, number> }[];
  dailyOpen: boolean;
  /** Cadeau du jour disponible (calculé hors rendu). */
  dailyAvailable: boolean;
  setDailyOpen(v: boolean): void;
  collect(id: string): number;
  collectAll(): number;
  hireManager(id: string): boolean;
  moveSeat(id: string, seat: number, x: number, y: number): boolean;
  claimDaily(): boolean;
  prestige(): boolean;
  /** Lieu dont la fiche est ouverte. */
  selected: string | null;
  select(id: string | null): void;
  init(): Promise<void>;
  step(): void;
  save(): Promise<void>;
  resumeFromBackground(): void;
  dismissOffline(): void;
  setSpeed(n: number): void;
  setHaptics(v: boolean): void;
  reset(): Promise<void>;
  // achats
  buy(p: Purchase): boolean;
  levelUp(id: string): boolean;
  addSeat(id: string): boolean;
  upgradeSeat(id: string, seat: number, n?: number): boolean;
  upgradeTrack(id: string, track: string): boolean;
  buyProp(id: string, prop: string): boolean;
  buyCourse(id: CourseId): boolean;
  buyDorm(): boolean;
  buyExam(): boolean;
  upgradeProf(id: CourseId): boolean;
  upgradeSpeed(id: string): boolean;
  claimAd(): boolean;
  dismissAd(): void;
  /** Arbre enchanté : cueillir le fruit (avec la pub : +Diamant). */
  harvestTree(withAd: boolean): boolean;
  buyGemItem(id: GemItemId): boolean;
  /** Fenêtres ouvertes : arbre, boutique de Diamants, administration. */
  panel: 'tree' | 'gems' | 'admin' | null;
  /** Heure réelle (ms) du dernier tick, pour les minuteurs en temps réel. */
  clock: number;
  openPanel(p: 'tree' | 'gems' | 'admin' | null): void;
  /** Ré-applique les réglages administrateur et redessine. */
  refresh(): void;
  /** Éditeur de décor (administration). */
  editor: EditorState;
  setEditor(patch: Partial<EditorState>): void;
  /** Version du décor : incrémentée à chaque modification (redessine la carte). */
  decorRev: number;
  /** À appeler après une modification du décor : redessine et enregistre. */
  decorChanged(): void;
  setBias(h: HouseId | null): boolean;
}

let keySeq = 1;
/** Dernière annonce par type : le Chaporacle et les départs ne s'affichent pas à chaque fois. */
const lastToast: Record<string, number> = {};
const TOAST_GAP_MS = { sorted: 120_000, left: 300_000, graduated: 30_000 } as const;
function throttled(kind: keyof typeof TOAST_GAP_MS, now: number): boolean {
  if (now - (lastToast[kind] ?? -Infinity) < TOAST_GAP_MS[kind]) return true;
  lastToast[kind] = now;
  return false;
}
/** Indique si l'absence a dépassé le plafond hors-ligne (avant de remettre l'horloge). */
function markCap(summary: OfflineSummary, g: GameState) {
  const cap = offlineCap(g);
  summary.cap = cap;
  summary.capped = (Date.now() - g.lastSavedAt) / 1000 > cap;
}

const FLOATER_MS = 1200;
const TOAST_MS = 3500;

export const useGame = create<Store>((set, get) => {
  const purchased = (ok: boolean) => {
    if (ok) {
      if (get().haptics)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      set((s) => ({ rev: s.rev + 1 }));
    } else if (get().haptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
    return ok;
  };

  const handleEvents = (events: GameEvent[]) => {
    if (!events.length) return;
    const now = Date.now();
    const floaters = get().floaters.filter((f) => now - f.born < FLOATER_MS);
    let toasts = get().toasts.filter((t) => now - t.born < TOAST_MS);
    for (const e of events) {
      if (e.type === 'coins') {
        // « Coffre plein » : au plus une fois toutes les 5 s par salle.
        // Moins de textes à l'écran : un gain par salle toutes les 2 s, « coffre plein » toutes les 30 s.
        if (
          floaters.some(
            (f) =>
              f.stationId === e.stationId &&
              (e.amount <= 0
                ? f.text.startsWith('📦') && now - f.born < 30_000
                : now - f.born < 2000),
          )
        )
          continue;
        floaters.push({
          key: keySeq++,
          stationId: e.stationId,
          text: e.amount > 0 ? `+${e.amount} 💰` : '📦 Coffre plein !',
          color: e.amount > 0 ? '#FFD86B' : '#FFB3A7',
          born: now,
        });
      } else if (e.type === 'fail') {
        continue;
      } else if (e.type === 'sorted') {
        if (throttled('sorted', now)) continue;
        toasts.push({
          key: keySeq++,
          kind: 'sorted',
          house: e.house,
          title: e.name,
          line: e.line,
          born: now,
        });
      } else if (e.type === 'left') {
        // Départ normal (scolarité terminée) : pas d'annonce ; attente trop longue : de temps en temps.
        if (e.reason === 'done' || throttled('left', now)) continue;
        if (toasts.length) continue;
        toasts.push({
          key: keySeq++,
          kind: 'left',
          title: e.name,
          born: now,
        });
      } else if (e.type === 'cupWon') {
        toasts.push({
          key: keySeq++,
          kind: 'cup',
          house: e.house,
          title: String(e.coins),
          born: now,
        });
      } else if (e.type === 'yearUp') {
        // Passage d'année : plus d'annonce (trop fréquent).
        continue;
      } else if (e.type === 'graduated') {
        if (throttled('graduated', now)) continue;
        toasts.push({
          key: keySeq++,
          kind: 'graduated',
          house: e.house ?? undefined,
          icon: '🎓',
          title: t('event.graduated', {
            name: e.name,
            career: `${t(`career.${e.career}`)} (${GRADES.find((g) => g.id === e.grade)?.label ?? ''})`,
            coins: e.coins,
          }),
          born: now,
        });
      } else if (e.type === 'event') {
        if (e.id === 'broomFall' && e.stationId) {
          floaters.push({
            key: keySeq++,
            stationId: e.stationId,
            text: '🤕 Aïe !',
            color: '#FFB3A7',
            born: now,
          });
        } else {
          toasts.push({
            key: keySeq++,
            kind: 'event',
            icon: EVENTS[e.id].icon,
            title: t(`event.${e.id}`, { v: e.value ?? '' }),
            born: now,
          });
        }
      } else if (e.type === 'relic') {
        toasts.push({
          key: keySeq++,
          kind: 'relic',
          icon: '🏺',
          title: t('event.relic', { name: t(`relic.${e.id}`) }),
          born: now,
        });
      }
    }
    toasts = toasts.slice(-2);
    set({ floaters: floaters.slice(-40), toasts });
  };

  return {
    game: createGame(Date.now() & 0x7fffffff, Date.now()),
    rev: 0,
    ready: false,
    speed: 1,
    haptics: true,
    floaters: [],
    toasts: [],
    offline: null,
    student: null,
    selectStudent: (id) => set({ student: id }),
    history: [],
    dailyOpen: false,
    dailyAvailable: false,
    setDailyOpen: (v) => set({ dailyOpen: v }),
    collect: (id) => {
      const n = collect(get().game, id);
      if (n > 0) {
        if (get().haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        set((s) => ({
          floaters: [
            ...s.floaters,
            { key: keySeq++, stationId: id, text: `+${n} 💰`, color: '#FFD86B', born: Date.now() },
          ],
          rev: s.rev + 1,
        }));
      }
      return n;
    },
    collectAll: () => {
      const n = collectAll(get().game);
      if (n > 0) set((s) => ({ rev: s.rev + 1 }));
      return n;
    },
    hireManager: (id) => purchased(hireManager(get().game, id)),
    moveSeat: (id, seat, x, y) => {
      const st = get().game.stations[id];
      if (!st) return false;
      return purchased(moveSeat(get().game, id, seat, x, y, (i) => seatSpot(st.kind, i)));
    },
    claimDaily: () => {
      const events: GameEvent[] = [];
      const ok = claimDaily(get().game, dayNumber(Date.now()), events);
      handleEvents(events);
      set({ dailyAvailable: false });
      return purchased(ok);
    },
    prestige: () => {
      const next = prestige(get().game, Date.now() & 0x7fffffff, Date.now());
      if (!next) return false;
      set({ game: next, floaters: [], toasts: [], history: [], selected: null, student: null });
      writeSave(next);
      return purchased(true);
    },
    selected: null,
    select: (id) => set({ selected: id }),

    async init() {
      // Réglages de l'administration, avant de charger la partie.
      applyTuning(await loadTuning());
      setDecorEdits(await loadDecor());
      const saved = await loadSave();
      if (saved) {
        const seconds = elapsedSince(saved, Date.now());
        const summary = seconds > 0 ? catchUp(saved, seconds) : null;
        if (summary) markCap(summary, saved);
        saved.lastSavedAt = Date.now();
        set({
          game: saved,
          ready: true,
          offline: summary && seconds > 30 ? summary : null,
          rev: get().rev + 1,
        });
      } else {
        set({ ready: true });
      }
      const g = get().game;
      if (canClaimDaily(g, dayNumber(Date.now()))) set({ dailyOpen: true, dailyAvailable: true });
    },

    step() {
      const { game, speed } = get();
      const all: GameEvent[] = [];
      for (let i = 0; i < speed; i++) all.push(...tick(game, TICK_SECONDS));
      handleEvents(all);
      // Purge des textes flottants et annonces expirés
      const now = Date.now();
      const { floaters, toasts, history } = get();
      // Échantillon pour le rapport (toutes les 5 s, 1 min glissante)
      if (!history.length || now - history[history.length - 1].at >= 5000) {
        const byStation: Record<string, number> = {};
        for (const st of Object.values(game.stations)) byStation[st.id] = st.stats.earned;
        const total =
          game.totals.coinsEarned +
          Object.values(game.stations).reduce((a, st) => a + st.pending, 0);
        set({
          history: [...history, { at: now, total, byStation }].slice(-13),
          dailyAvailable: canClaimDaily(game, dayNumber(now)),
        });
      }
      const f = floaters.filter((x) => now - x.born < FLOATER_MS);
      const tt = toasts.filter((x) => now - x.born < TOAST_MS);
      set((s) => ({
        rev: s.rev + 1,
        clock: now,
        ...(f.length !== floaters.length ? { floaters: f } : {}),
        ...(tt.length !== toasts.length ? { toasts: tt } : {}),
      }));
    },

    async save() {
      await writeSave(get().game);
    },

    resumeFromBackground() {
      const { game } = get();
      const seconds = elapsedSince(game, Date.now());
      if (seconds <= 30) return;
      const summary = catchUp(game, seconds);
      markCap(summary, game);
      game.lastSavedAt = Date.now();
      set({ offline: summary, rev: get().rev + 1 });
    },

    dismissOffline: () => set({ offline: null }),
    setSpeed: (n) => set({ speed: n }),
    setHaptics: (v) => set({ haptics: v }),

    async reset() {
      await clearSave();
      set({
        game: createGame(Date.now() & 0x7fffffff, Date.now()),
        floaters: [],
        toasts: [],
        offline: null,
        rev: get().rev + 1,
      });
    },

    buy: (p) => purchased(applyPurchase(get().game, p)),
    levelUp: (id) => purchased(levelUp(get().game, id)),
    addSeat: (id) => purchased(addSeat(get().game, id)),
    upgradeSeat: (id, seat, n = 1) => {
      const st = get().game.stations[id];
      const before = st ? seatTier(st.seats[seat]?.level ?? 1) : 0;
      const ok = purchased(upgradeSeatMany(get().game, id, seat, n) > 0);
      if (ok && st && seatTier(st.seats[seat].level) > before) {
        set((s) => ({
          floaters: [
            ...s.floaters,
            {
              key: keySeq++,
              stationId: id,
              text: '✨ Évolution !',
              color: '#E9C8FF',
              born: Date.now(),
            },
          ],
        }));
      }
      return ok;
    },
    upgradeTrack: (id, tr) => purchased(upgradeTrack(get().game, id, tr)),
    buyProp: (id, pr) => purchased(buyProp(get().game, id, pr)),
    buyCourse: (id) => purchased(buyCourse(get().game, id)),
    buyDorm: () => purchased(buyDorm(get().game)),
    buyExam: () => purchased(buyExam(get().game)),
    upgradeProf: (id) => purchased(upgradeProf(get().game, id)),
    upgradeSpeed: (id) => purchased(upgradeSpeed(get().game, id)),
    claimAd: () => purchased(claimAd(get().game)),
    harvestTree: (withAd) => purchased(harvestTree(get().game, Date.now(), withAd)),
    buyGemItem: (id) => purchased(buyGemItem(get().game, id)),
    panel: null,
    clock: Date.now(),
    openPanel: (p) => set({ panel: p }),
    refresh: () => set((s) => ({ rev: s.rev + 1 })),
    editor: { on: false, sel: null, placing: null },
    setEditor: (patch) => set((s) => ({ editor: { ...s.editor, ...patch } })),
    decorRev: 0,
    decorChanged: () => {
      writeDecor(getDecorEdits());
      set((s) => ({ decorRev: s.decorRev + 1 }));
    },
    dismissAd: () => {
      dismissAd(get().game);
      set((s) => ({ rev: s.rev + 1 }));
    },
    setBias: (h) => purchased(setSortingBias(get().game, h)),
  };
});

/** Abonnement au rythme de la simulation (re-rendu à chaque tick). */
export function useTick(): number {
  return useGame((s) => s.rev);
}
