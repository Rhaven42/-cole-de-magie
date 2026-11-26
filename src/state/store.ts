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
  upgradeTrack,
  setSortingBias,
  tick,
  TICK_SECONDS,
  type GameEvent,
  type GameState,
  type OfflineSummary,
  type Purchase,
} from '../engine';
import type { CourseId } from '../data/courses';
import type { HouseId } from '../data/houses';
import { clearSave, loadSave, writeSave } from './persistence';

export interface Floater {
  key: number;
  stationId: string;
  text: string;
  color: string;
  born: number;
}

export interface Toast {
  key: number;
  kind: 'sorted' | 'left' | 'cup';
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
          text: `+${e.amount} 💰`,
          color: '#FFD86B',
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
      }
    }
    toasts = toasts.slice(-3);
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
    },

    step() {
      const { game, speed } = get();
      const all: GameEvent[] = [];
      for (let i = 0; i < speed; i++) all.push(...tick(game, TICK_SECONDS));
      handleEvents(all);
      // Purge des textes flottants et annonces expirés
      const now = Date.now();
      const { floaters, toasts } = get();
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
    upgradeSeat: (id, seat) => purchased(upgradeSeat(get().game, id, seat)),
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
