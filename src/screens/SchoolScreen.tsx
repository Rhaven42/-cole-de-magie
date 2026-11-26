import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  GestureDetector,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { COURSES, UNLOCKED_COURSES } from '../data/courses';
import { ISO, PLOT, PLOTS } from '../data/layout';
import { DORM_PURCHASE } from '../data/stations';
import { courseCost, dormCount, estimatedWait, type GameState, type Station } from '../engine';
import { useGame, useTick } from '../state/store';
import { FloatText } from '../ui/Floater';
import { hitPlot, iso, MAP_H, MAP_W, plotOrigin, queueSpot, seatSpot, unIso } from '../ui/iso';
import { MapArt, type RoomSnapshot } from '../ui/MapArt';
import { stationName } from '../ui/kit';
import { colors, formatDuration, formatNumber } from '../ui/theme';
import { Walker } from '../ui/Walker';
import { Hat, ThinkingCrests } from '../ui/Hat';

const MIN_SCALE = 0.35;
const MAX_SCALE = 1.8;
const MAX_QUEUE_SHOWN = 20;

/** Position écran (carte) de chaque élève visible. */
function studentPositions(game: GameState) {
  const out: { id: number; x: number; y: number; sleeping: boolean }[] = [];
  for (const st of Object.values(game.stations)) {
    const def = PLOTS[st.id];
    if (!def) continue;
    const o = plotOrigin(def.px, def.py);
    st.seats.forEach((seat, i) => {
      if (seat.occupant === null) return;
      const sp = seatSpot(st.kind, i);
      const dx = st.kind === 'dorm' ? -0.2 : st.kind === 'hall' ? 0 : 0.35;
      const p = iso(o.x + sp.x + dx, o.y + sp.y + (st.kind === 'hall' ? 0 : 0.1));
      out.push({ id: seat.occupant, x: p.x, y: p.y, sleeping: st.kind === 'dorm' });
    });
    st.queue.slice(0, MAX_QUEUE_SHOWN).forEach((id, k) => {
      const q = queueSpot(k);
      const p = iso(o.x + q.x, o.y + q.y);
      out.push({ id, x: p.x, y: p.y, sleeping: false });
    });
  }
  return out;
}

function snapshot(game: GameState) {
  const rooms: RoomSnapshot[] = game.stationOrder.map((id) => {
    const s = game.stations[id];
    return { id, kind: s.kind, courseId: s.courseId, level: s.level, seats: s.seats.length };
  });
  const plots: { id: string; available: boolean }[] = [];
  for (const cid of Object.keys(COURSES)) {
    const id = `course-${cid}`;
    if (!game.stations[id]) plots.push({ id, available: UNLOCKED_COURSES.includes(cid as never) });
  }
  const nextDorm = dormCount(game);
  if (nextDorm < DORM_PURCHASE.max) plots.push({ id: `dorm-${nextDorm}`, available: true });
  return { rooms, plots };
}

function RoomLabel({ st }: { st: Station }) {
  const def = PLOTS[st.id];
  const o = plotOrigin(def.px, def.py);
  const p = iso(o.x + PLOT.size / 2, o.y + PLOT.size / 2);
  const crowded = st.queue.length > st.seats.length * 1.5;
  return (
    <View
      pointerEvents="none"
      style={[styles.label, { left: p.x - 70, top: iso(o.x, o.y).y - ISO.wallH - 26 }]}
    >
      <Text style={styles.labelName} numberOfLines={1}>
        {stationName(st)} <Text style={styles.labelLvl}>· {st.level}</Text>
      </Text>
      <Text style={styles.labelSub}>
        👥 {st.queue.length} · ⏳ {formatDuration(estimatedWait(st))}
      </Text>
      {crowded ? <View style={styles.badge} /> : null}
    </View>
  );
}

function BuildSign({ id, game }: { id: string; game: GameState }) {
  const def = PLOTS[id];
  const o = plotOrigin(def.px, def.py);
  const p = iso(o.x + PLOT.size / 2, o.y + PLOT.size / 2);
  const isCourse = id.startsWith('course-');
  const cid = id.slice(7) as keyof typeof COURSES;
  const cost = isCourse ? courseCost(game, cid) : null;
  const locked = isCourse && !UNLOCKED_COURSES.includes(cid);
  const text = isCourse
    ? `${COURSES[cid].icon} ${stationName({ kind: 'course', courseId: cid } as Station)}`
    : '🛏️ Dortoir';
  return (
    <View
      pointerEvents="none"
      style={[styles.sign, { left: p.x - 65, top: p.y - 22 }, locked && { opacity: 0.6 }]}
    >
      <Text style={styles.signText} numberOfLines={1}>
        {locked ? '🔒 ' : '🔨 '}
        {text}
      </Text>
      <Text style={[styles.signPrice, cost !== null && game.coins >= cost && { color: '#8BE08F' }]}>
        {locked
          ? `Année ${COURSES[cid].yearMin}+`
          : cost !== null
            ? `${formatNumber(cost)} 💰`
            : 'Construire'}
      </Text>
    </View>
  );
}

/** Méliandre sur son piédestal, au centre du Salon des Destinées. */
function SortingHat({ game }: { game: GameState }) {
  const st = game.stations.sorting;
  const def = PLOTS.sorting;
  const o = plotOrigin(def.px, def.py);
  const c = iso(o.x + 4, o.y + 4);
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

/** École en vue isométrique : glisser pour se déplacer, pincer pour zoomer, toucher une salle. */
export function SchoolScreen() {
  useTick();
  const game = useGame((s) => s.game);
  const floaters = useGame((s) => s.floaters);
  const select = useGame((s) => s.select);
  const [size, setSize] = useState({ w: 390, h: 700 });

  // Cadrage initial : Accueil, Salon, Grande Salle et Potions visibles.
  const start = iso(plotOrigin(3, 2).x + 7, plotOrigin(3, 2).y + 7);
  const scale = useSharedValue(0.62);
  const tx = useSharedValue(195 - start.x * 0.62);
  const ty = useSharedValue(400 - start.y * 0.62);

  const clampT = (s: number, w: number, h: number) => {
    'worklet';
    tx.value = Math.min(w * 0.6, Math.max(w * 0.4 - MAP_W * s, tx.value));
    ty.value = Math.min(h * 0.6, Math.max(h * 0.4 - MAP_H * s, ty.value));
  };
  const W = size.w;
  const H = size.h;

  const pan = usePanGesture({
    onUpdate: (e) => {
      'worklet';
      tx.value += e.changeX;
      ty.value += e.changeY;
      clampT(scale.value, W, H);
    },
  });
  const pinch = usePinchGesture({
    onUpdate: (e) => {
      'worklet';
      const s0 = scale.value;
      const s1 = Math.min(MAX_SCALE, Math.max(MIN_SCALE, s0 * e.scaleChange));
      tx.value = e.focalX - (e.focalX - tx.value) * (s1 / s0);
      ty.value = e.focalY - (e.focalY - ty.value) * (s1 / s0);
      scale.value = s1;
      clampT(s1, W, H);
    },
  });
  const tap = useTapGesture({
    runOnJS: true,
    maxDistance: 12,
    onActivate: (e) => {
      const mx = (e.x - tx.value) / scale.value;
      const my = (e.y - ty.value) / scale.value;
      const id = hitPlot(unIso(mx, my));
      if (!id) return;
      const st = useGame.getState().game.stations[id];
      if (st || id.startsWith('course-') || id === `dorm-${dormCount(useGame.getState().game)}`)
        select(id);
    },
  });
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
  const positions = studentPositions(game).sort((a, b) => a.y - b.y);

  return (
    <View
      style={styles.viewport}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <GestureDetector gesture={gesture}>
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[styles.map, mapStyle]}>
            <MapArt rooms={stableSnap.rooms} plots={stableSnap.plots} />
            {stableSnap.plots.map((p) => (
              <BuildSign key={p.id} id={p.id} game={game} />
            ))}
            {positions.map((p) => {
              const s = game.students[p.id];
              return s ? (
                <Walker key={p.id} student={s} x={p.x} y={p.y} sleeping={p.sleeping} />
              ) : null;
            })}
            <SortingHat game={game} />
            {game.stationOrder.map((id) => (
              <RoomLabel key={id} st={game.stations[id]} />
            ))}
            {floaters.map((f) => {
              const def = PLOTS[f.stationId];
              if (!def) return null;
              const o = plotOrigin(def.px, def.py);
              const c = iso(o.x + PLOT.size / 2, o.y + PLOT.size / 2);
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
      <View style={styles.zoomCol}>
        <Pressable style={styles.zoomBtn} onPress={() => zoom(1.25)} accessibilityLabel="Zoomer">
          <Text style={styles.zoomText}>＋</Text>
        </Pressable>
        <Pressable style={styles.zoomBtn} onPress={() => zoom(0.8)} accessibilityLabel="Dézoomer">
          <Text style={styles.zoomText}>－</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { flex: 1, backgroundColor: '#5E9446', overflow: 'hidden' },
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
  floatBox: { position: 'absolute', width: 120, height: 60 },
});
