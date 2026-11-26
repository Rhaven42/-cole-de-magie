import * as Haptics from 'expo-haptics';
import { create } from 'zustand';
import {
  applyPurchase,
  buyCourse,
  buyDorm,
  catchUp,
  createGame,
  elapsedSince,
  levelUp,
  addSeat,
  upgradeSeat,
  seatTier,
  upgradeTrack,
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
import type { HouseId } from '../data/houses';
import { clearSave, loadSave, writeSave } from './persistence';
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
  upgradeSeat(id: string, seat: number): boolean;
  upgradeTrack(id: string, track: string): boolean;
  buyCourse(id: CourseId): boolean;
  buyDorm(): boolean;
  setBias(h: HouseId | null): boolean;
}

let keySeq = 1;
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
        floaters.push({
          key: keySeq++,
          stationId: e.stationId,
          text: e.amount > 0 ? `+${e.amount} 💰` : '📦 Coffre plein !',
          color: e.amount > 0 ? '#FFD86B' : '#FFB3A7',
          born: now,
        });
      } else if (e.type === 'fail') {
        floaters.push({
          key: keySeq++,
          stationId: e.stationId,
          text: '💥 Raté !',
          color: '#FF8A7A',
          born: now,
        });
      } else if (e.type === 'sorted') {
        toasts.push({
          key: keySeq++,
          kind: 'sorted',
          house: e.house,
          title: e.name,
          line: e.line,
          born: now,
        });
      } else if (e.type === 'left') {
        toasts.push({ key: keySeq++, kind: 'left', title: e.name, born: now });
      } else if (e.type === 'cupWon') {
        toasts.push({
          key: keySeq++,
          kind: 'cup',
          house: e.house,
          title: String(e.coins),
          born: now,
        });
      } else if (e.type === 'yearUp') {
        const a = get().game.students[e.studentId]?.activity;
        if (a && a.mode !== 'free') {
          floaters.push({
            key: keySeq++,
            stationId: a.stationId,
            text: t('event.yearUp', { n: e.year }),
            color: '#BFE6FF',
            born: now,
          });
        }
      } else if (e.type === 'graduated') {
        toasts.push({
          key: keySeq++,
          kind: 'graduated',
          house: e.house ?? undefined,
          icon: '🎓',
          title: t('event.graduated', {
            name: e.name,
            career: t(`career.${e.career}`),
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
      const saved = await loadSave();
      if (saved) {
        const seconds = elapsedSince(saved, Date.now());
        const summary = seconds > 0 ? catchUp(saved, seconds) : null;
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
    upgradeSeat: (id, seat) => {
      const st = get().game.stations[id];
      const before = st ? seatTier(st.seats[seat]?.level ?? 1) : 0;
      const ok = purchased(upgradeSeat(get().game, id, seat));
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
    buyCourse: (id) => purchased(buyCourse(get().game, id)),
    buyDorm: () => purchased(buyDorm(get().game)),
    setBias: (h) => purchased(setSortingBias(get().game, h)),
  };
});

/** Abonnement au rythme de la simulation (re-rendu à chaque tick). */
export function useTick(): number {
  return useGame((s) => s.rev);
}
