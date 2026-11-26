import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SPRITES } from '../assets';
import {
  GestureDetector,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { COURSES, type CourseId } from '../data/courses';
import { ENVIRONMENTS } from '../data/environments';
import { EVENTS } from '../data/events';
import { PLOT, PLOTS } from '../data/layout';
import { DORM_PURCHASE } from '../data/stations';
import {
  courseCost,
  dormCount,
  estimatedWait,
  isClosed,
  seatTier,
  storageCap,
  type GameState,
  type Station,
} from '../engine';
import { useGame, useTick } from '../state/store';
import { FloatText } from '../ui/Floater';
import { Hat, ThinkingCrests } from '../ui/Hat';
import {
  courtyard,
  gatePoint,
  hitPlot,
  iso,
  MAP_H,
  MAP_W,
  roomOrigin,
  queueSpotFor,
  roomSize,
  seatPos,
  unIso,
  type Anchor,
  type Pt,
} from '../ui/iso';
import { MapArt, type RoomSnapshot } from '../ui/MapArt';
import { stationName } from '../ui/kit';
import { colors, formatDuration, formatNumber } from '../ui/theme';
import { Walker } from '../ui/Walker';
import { Ambient } from '../ui/Ambient';
import { nightFactor } from '../data/daynight';

const MIN_SCALE = 0.25;
const MAX_SCALE = 1.8;
const MAX_QUEUE_SHOWN = 16;
/** Nombre max d'élèves dessinés (la simulation, elle, gère tout le monde). */
const MAX_AGENTS = 60;

interface Placed {
  id: number;
  anchor: Anchor;
  sleeping: boolean;
  /** Vu de dos (élève tourné vers le tableau en classe). */
  back: boolean;
  /** Priorité d'affichage (places d'abord, puis tête de file). */
  prio: number;
}

/** Ancrage (grille absolue + salle) de chaque élève visible. */
function placeStudents(game: GameState): Placed[] {
  const out: Placed[] = [];
  for (const st of Object.values(game.stations)) {
    const def = PLOTS[st.id];
    if (!def) continue;
    const o = roomOrigin(def);
    st.seats.forEach((seat, i) => {
      if (seat.occupant === null) return;
      const sp = seatPos(st.kind, i, seat.pos);
      // En classe, l'élève se tient derrière son poste, tourné vers le tableau (vu de dos).
      // En classe et à l'examen, l'élève est tourné vers le professeur (vu de dos).
      const course = st.kind === 'course' || st.kind === 'exam';
      const dx = st.kind === 'dorm' ? -0.2 : st.kind === 'hall' ? 0 : course ? 0.6 : 0.35;
      const dy = st.kind === 'hall' ? 0 : course ? 0.15 : 0.1;
      out.push({
        id: seat.occupant,
        anchor: { g: { x: o.x + sp.x + dx, y: o.y + sp.y + dy }, room: st.id },
        sleeping: st.kind === 'dorm',
        back: course,
        prio: 0,
      });
    });
    st.queue.slice(0, MAX_QUEUE_SHOWN).forEach((id, k) => {
      const q = queueSpotFor(st.id, k);
      out.push({
        id,
        anchor: { g: { x: o.x + q.x, y: o.y + q.y }, room: null },
        sleeping: false,
        back: false,
        prio: 1 + k,
      });
    });
  }
  return out.sort((a, b) => a.prio - b.prio).slice(0, MAX_AGENTS);
}

function seatsOf(st: Station): Pt[] {
  return st.seats.map((seat, i) => seatPos(st.kind, i, seat.pos));
}

function snapshot(game: GameState) {
  const rooms: RoomSnapshot[] = game.stationOrder.map((id) => {
    const s = game.stations[id];
    return {
      id,
      kind: s.kind,
      courseId: s.courseId,
      level: s.level,
      seats: seatsOf(s),
      seatTiers: s.seats.map((x) => seatTier(x.level)),
    };
  });
  const plots: { id: string; available: boolean }[] = [];
  for (const cid of Object.keys(COURSES)) {
    const id = `course-${cid}`;
    if (!game.stations[id]) plots.push({ id, available: true });
  }
  const nextDorm = dormCount(game);
  if (nextDorm < DORM_PURCHASE.max) plots.push({ id: `dorm-${nextDorm}`, available: true });
  return { rooms, plots, env: game.meta.env };
}

function roomCenter(id: string): Pt {
  const def = PLOTS[id];
  const o = roomOrigin(def);
  const { w, h } = roomSize(id);
  return iso(o.x + w / 2, o.y + h / 2);
}

/** Position du coffre (écran carte) : coin avant de la salle. */
function cofferPos(id: string): Pt {
  const def = PLOTS[id];
  const o = roomOrigin(def);
  const p = iso(o.x + PLOT.size - 1.2, o.y + PLOT.size * 0.42);
  return { x: p.x, y: p.y - 22 };
}

function RoomLabel({ st, managed }: { st: Station; managed: boolean }) {
  const def = PLOTS[st.id];
  const o = roomOrigin(def);
  // Panneau posé devant le coin avant de la salle (dans le couloir).
  const { w: rw, h: rh } = roomSize(st.id);
  const front = iso(o.x + rw - PLOT.size * 0.2, o.y + rh - PLOT.size * 0.2);
  const crowded = st.queue.length > st.seats.length * 1.5;
  return (
    <View pointerEvents="none" style={[styles.label, { left: front.x - 70, top: front.y - 18 }]}>
      <Text style={styles.labelName} numberOfLines={1}>
        {managed ? '👔 ' : ''}
        {stationName(st)} <Text style={styles.labelLvl}>· {st.level}</Text>
      </Text>
      <Text style={styles.labelSub}>
        👥 {st.queue.length} · ⏳ {formatDuration(estimatedWait(st))}
      </Text>
      {crowded ? <View style={styles.badge} /> : null}
    </View>
  );
}

function Coffer({ st }: { st: Station }) {
  const p = cofferPos(st.id);
  const full = st.pending >= storageCap(st);
  return (
    <View
      pointerEvents="none"
      style={[styles.coffer, full && styles.cofferFull, { left: p.x - 32, top: p.y - 16 }]}
    >
      <Text style={styles.cofferText}>💰 {formatNumber(st.pending)}</Text>
    </View>
  );
}

function BuildSign({ id, game }: { id: string; game: GameState }) {
  const p = roomCenter(id);
  const isCourse = id.startsWith('course-');
  const cid = id.slice(7) as CourseId;
  const cost = isCourse ? courseCost(game, cid) : null;
  const text = isCourse
    ? `${COURSES[cid].icon} ${stationName({ kind: 'course', courseId: cid } as Station)}`
    : '🛏️ Dortoir';
  const affordable = cost !== null && game.coins >= cost;
  return (
    <View pointerEvents="none" style={[styles.sign, { left: p.x - 65, top: p.y - 26 }]}>
      <Text style={styles.signText} numberOfLines={1}>
        🔨 {text}
      </Text>
      <Text style={[styles.signPrice, affordable && { color: '#8BE08F' }]}>
        {cost !== null ? `${formatNumber(cost)} 💰` : 'Construire'}
      </Text>
      {isCourse ? <Text style={styles.signYear}>Année {COURSES[cid].yearMin}+</Text> : null}
    </View>
  );
}

/** Méliandre sur son piédestal, au centre du Salon des Destinées. */
function SortingHat({ game }: { game: GameState }) {
  const st = game.stations.sorting;
  const o = roomOrigin(PLOTS.sorting);
  const c = iso(o.x + PLOT.size / 2, o.y + PLOT.size / 2);
  const busy = st.seats.some((x) => x.occupant !== null);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: c.x - 24, top: c.y - 62 }}>
      <Hat size={48} talking={busy} />
      {busy ? (
        <View style={{ position: 'absolute', left: 36, top: -30 }}>
          <ThinkingCrests size={38} />
        </View>
      ) : null}
    </View>
  );
}

/** Marqueurs visuels des événements en cours (fumée, fantôme, étoiles, banquet). */
function EventMarkers({ game }: { game: GameState }) {
  const marks: { key: string; id: string; icon: string; big?: boolean }[] = [];
  for (const st of Object.values(game.stations)) {
    if (isClosed(game, st)) marks.push({ key: `x-${st.id}`, id: st.id, icon: '💨💥💨', big: true });
  }
  for (const e of game.events) {
    if (e.until <= game.time) continue;
    if (e.id === 'ghost' && e.stationId)
      marks.push({ key: `g-${e.stationId}`, id: e.stationId, icon: EVENTS.ghost.icon, big: true });
    if (e.id === 'banquet') marks.push({ key: 'banquet', id: 'hall', icon: '🍗🎉🥧', big: true });
    if (e.id === 'shootingStars') {
      for (const id of ['course-astronomy', 'course-divination'])
        if (game.stations[id]) marks.push({ key: `s-${id}`, id, icon: '🌠✨🌠', big: true });
    }
  }
  return (
    <>
      {marks.map((m) => {
        const c = roomCenter(m.id);
        if (m.key.startsWith('g-')) {
          return (
            <Image
              key={m.key}
              source={SPRITES.ghost.src}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: c.x - 28,
                top: c.y - 96,
                width: 56,
                height: (56 * SPRITES.ghost.h) / SPRITES.ghost.w,
                opacity: 0.85,
              }}
            />
          );
        }
        return (
          <Text
            key={m.key}
            pointerEvents="none"
            style={[styles.mark, { left: c.x - 60, top: c.y - 70 }, m.big && { fontSize: 30 }]}
          >
            {m.icon}
          </Text>
        );
      })}
    </>
  );
}

/** Filtre de lumière : nuit bleutée, crépuscule et aube orangés. */
function DayNight({ time }: { time: number }) {
  const n = nightFactor(time);
  const twilight = 1 - Math.abs(2 * n - 1);
  if (n <= 0.001) return null;
  return (
    <>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#0A1440', opacity: 0.36 * n }]}
      />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#FF7A3C', opacity: 0.12 * twilight }]}
      />
    </>
  );
}

/** École en vue isométrique : glisser pour se déplacer, pincer pour zoomer, toucher une salle ou un élève. */
export function SchoolScreen() {
  useTick();
  const game = useGame((s) => s.game);
  const floaters = useGame((s) => s.floaters);
  const [size, setSize] = useState({ w: 390, h: 700 });

  // Cadrage initial : Accueil, Salon, Grande Salle et Potions visibles.
  // Cadrage initial : la cour d'entrée, l'Accueil et le Salon des Destinées.
  const cy = courtyard();
  const start = iso((cy.pathX + cy.gateX) / 2 - 3, (cy.schoolFrontY + cy.gateY) / 2 - 6);
  const scale = useSharedValue(0.5);
  const tx = useSharedValue(195 - start.x * 0.5);
  const ty = useSharedValue(380 - start.y * 0.5);

  const W = size.w;
  const H = size.h;
  const clampT = (s: number) => {
    'worklet';
    tx.value = Math.min(W * 0.25, Math.max(W * 0.75 - MAP_W * s, tx.value));
    ty.value = Math.min(H * 0.25, Math.max(H * 0.75 - MAP_H * s, ty.value));
  };

  const placed = placeStudents(game);

  const onTap = (sx: number, sy: number) => {
    const store = useGame.getState();
    const g = store.game;
    const mx = (sx - tx.value) / scale.value;
    const my = (sy - ty.value) / scale.value;
    // 1. Coffres
    for (const st of Object.values(g.stations)) {
      if (st.kind !== 'course' || st.pending < 1) continue;
      const p = cofferPos(st.id);
      if (Math.abs(mx - p.x) < 36 && Math.abs(my - p.y) < 20) {
        store.collect(st.id);
        return;
      }
    }
    // 2. Élèves (position cible)
    let best: { id: number; d: number } | null = null;
    for (const p of placeStudents(g)) {
      const s = iso(p.anchor.g.x, p.anchor.g.y);
      const d = Math.hypot(mx - s.x, my - (s.y - 10));
      if (d < 16 && (!best || d < best.d)) best = { id: p.id, d };
    }
    if (best) {
      store.selectStudent(best.id);
      return;
    }
    // 3. Salles et parcelles
    const id = hitPlot(unIso(mx, my));
    if (!id) return;
    if (g.stations[id] || id.startsWith('course-') || id === `dorm-${dormCount(g)}`)
      store.select(id);
  };

  // Configurations de gestes stables : sinon chaque rendu (4×/s) recrée les gestes
  // et un toucher en cours peut être annulé.
  const tapRef = useRef(onTap);
  useEffect(() => {
    tapRef.current = onTap;
  });
  const panConfig = useMemo(
    () => ({
      onUpdate: (e: { changeX: number; changeY: number }) => {
        'worklet';
        tx.value += e.changeX;
        ty.value += e.changeY;
        clampT(scale.value);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [W, H],
  );
  const pinchConfig = useMemo(
    () => ({
      onUpdate: (e: { scaleChange: number; focalX: number; focalY: number }) => {
        'worklet';
        const s0 = scale.value;
        const s1 = Math.min(MAX_SCALE, Math.max(MIN_SCALE, s0 * e.scaleChange));
        tx.value = e.focalX - (e.focalX - tx.value) * (s1 / s0);
        ty.value = e.focalY - (e.focalY - ty.value) * (s1 / s0);
        scale.value = s1;
        clampT(s1);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [W, H],
  );
  const tapConfig = useMemo(
    () => ({
      runOnJS: true,
      maxDistance: 12,
      onActivate: (e: { x: number; y: number }) => tapRef.current(e.x, e.y),
    }),
    [],
  );
  const pan = usePanGesture(panConfig);
  const pinch = usePinchGesture(pinchConfig);
  const tap = useTapGesture(tapConfig);
  const gesture = useSimultaneousGestures(pan, pinch, tap);

  const zoom = (f: number) => {
    const s0 = scale.value;
    const s1 = Math.min(MAX_SCALE, Math.max(MIN_SCALE, s0 * f));
    const cx = W / 2;
    const cy = H / 2;
    tx.value = withTiming(cx - (cx - tx.value) * (s1 / s0), { duration: 200 });
    ty.value = withTiming(cy - (cy - ty.value) * (s1 / s0), { duration: 200 });
    scale.value = withTiming(s1, { duration: 200 });
  };

  const mapStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  const snap = snapshot(game);
  const snapKey = JSON.stringify(snap);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableSnap = useMemo(() => snap, [snapKey]);
  const ordered = [...placed].sort(
    (a, b) => iso(a.anchor.g.x, a.anchor.g.y).y - iso(b.anchor.g.x, b.anchor.g.y).y,
  );
  const gate: Anchor = { g: gatePoint(), room: null };
  const env = ENVIRONMENTS[game.meta.env] ?? ENVIRONMENTS[0];

  return (
    <View
      style={[styles.viewport, { backgroundColor: env.backdrop }]}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <GestureDetector gesture={gesture}>
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[styles.map, mapStyle]}>
            <MapArt env={stableSnap.env} rooms={stableSnap.rooms} plots={stableSnap.plots} />
            {stableSnap.plots.map((p) => (
              <BuildSign key={p.id} id={p.id} game={game} />
            ))}
            {ordered.map((p) => {
              const s = game.students[p.id];
              if (!s) return null;
              const fresh = game.time - s.arrivedAt < 3;
              return (
                <Walker
                  key={p.id}
                  student={s}
                  anchor={p.anchor}
                  sleeping={p.sleeping}
                  back={p.back}
                  from={fresh ? gate : undefined}
                />
              );
            })}
            <Ambient game={game} />
            <SortingHat game={game} />
            <EventMarkers game={game} />
            {game.stationOrder.map((id) => (
              <RoomLabel key={id} st={game.stations[id]} managed={!!game.managers[id]} />
            ))}
            {game.stationOrder.map((id) => {
              const st = game.stations[id];
              return st.kind === 'course' && st.pending >= 1 && !game.managers[id] ? (
                <Coffer key={`c-${id}`} st={st} />
              ) : null;
            })}
            {floaters.map((f) => {
              if (!PLOTS[f.stationId]) return null;
              const c = roomCenter(f.stationId);
              return (
                <View
                  key={f.key}
                  pointerEvents="none"
                  style={[styles.floatBox, { left: c.x - 60, top: c.y - 40 }]}
                >
                  <FloatText text={f.text} color={f.color} offset={(f.key % 7) / 7} />
                </View>
              );
            })}
          </Animated.View>
        </View>
      </GestureDetector>
      <DayNight time={game.time} />
      <View style={styles.zoomCol}>
        <Pressable style={styles.zoomBtn} onPress={() => zoom(1.25)} accessibilityLabel="Zoomer">
          <Text style={styles.zoomText}>＋</Text>
        </Pressable>
        <Pressable style={styles.zoomBtn} onPress={() => zoom(0.8)} accessibilityLabel="Dézoomer">
          <Text style={styles.zoomText}>－</Text>
        </Pressable>
      </View>
      <Pressable
        style={styles.collectAll}
        onPress={() => useGame.getState().collectAll()}
        accessibilityLabel="Tout récolter"
      >
        <Text style={styles.collectText}>💰 Tout récolter</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { flex: 1, overflow: 'hidden' },
  map: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: MAP_W,
    height: MAP_H,
    transformOrigin: 'left top',
  },
  label: {
    position: 'absolute',
    width: 140,
    alignItems: 'center',
    backgroundColor: 'rgba(43,27,16,0.88)',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.goldDark,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  labelName: { color: colors.parchment, fontWeight: '800', fontSize: 11 },
  labelLvl: { color: colors.candle },
  labelSub: { color: colors.candle, fontSize: 10, fontWeight: '600' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF4D3D',
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  coffer: {
    position: 'absolute',
    width: 64,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFF3C4',
    borderWidth: 2,
    borderColor: colors.goldDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cofferFull: { backgroundColor: '#FFD86B', borderColor: '#C0392B' },
  cofferText: { fontWeight: '900', fontSize: 12, color: colors.ink },
  sign: {
    position: 'absolute',
    width: 130,
    alignItems: 'center',
    backgroundColor: 'rgba(90,58,34,0.92)',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#C9A27A',
    paddingVertical: 3,
  },
  signText: { color: colors.parchment, fontWeight: '800', fontSize: 11 },
  signPrice: { color: colors.candle, fontWeight: '800', fontSize: 12 },
  signYear: { color: colors.parchmentDark, fontSize: 9 },
  mark: { position: 'absolute', width: 120, textAlign: 'center', fontSize: 22 },
  zoomCol: { position: 'absolute', right: 12, bottom: 16, gap: 10 },
  zoomBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(43,27,16,0.88)',
    borderWidth: 2,
    borderColor: colors.goldDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomText: { color: colors.candle, fontSize: 24, fontWeight: '900' },
  collectAll: {
    position: 'absolute',
    left: 12,
    bottom: 16,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(43,27,16,0.88)',
    borderWidth: 2,
    borderColor: colors.goldDark,
    justifyContent: 'center',
  },
  collectText: { color: colors.candle, fontWeight: '900' },
  floatBox: { position: 'absolute', width: 120, height: 60 },
});
