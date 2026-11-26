import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COURSES } from '../data/courses';
import { SERVICES } from '../data/stations';
import { estimatedWait, type GameState, type Station } from '../engine';
import { useGame } from '../state/store';
import { Chibi } from './Chibi';
import { FloatText } from './Floater';
import { Hat, ThinkingCrests } from './Hat';
import { Bar, stationName } from './kit';
import { colors, formatDuration, radius, space } from './theme';

const SEAT = 30;
const MAX_QUEUE_SHOWN = 7;

function seatIcon(st: Station): string {
  if (st.kind === 'course') return COURSES[st.courseId!].icon;
  if (st.kind === 'reception') return '🗂️';
  return SERVICES[st.kind].icon;
}

function wallColor(st: Station): string {
  return st.kind === 'course' ? COURSES[st.courseId!].wall : SERVICES[st.kind].wall;
}

/** Aspect de la salle selon le niveau : modeste / confortable / prestigieuse. */
function tier(level: number): 0 | 1 | 2 {
  return level >= 8 ? 2 : level >= 4 ? 1 : 0;
}

export function RoomCard({
  game,
  station,
  wide,
}: {
  game: GameState;
  station: Station;
  wide?: boolean;
}) {
  const select = useGame((s) => s.select);
  const floaters = useGame((s) => s.floaters).filter((f) => f.stationId === station.id);
  const wait = estimatedWait(station);
  const crowded = station.queue.length > station.seats.length * 1.5;
  const lv = tier(station.level);
  const sorting = station.kind === 'sorting';
  const sortingBusy = sorting && station.seats.some((s) => s.occupant !== null);

  return (
    <Pressable
      onPress={() => select(station.id)}
      accessibilityRole="button"
      accessibilityLabel={stationName(station)}
      style={({ pressed }) => [
        styles.room,
        { backgroundColor: wallColor(station), flex: wide ? 2 : 1 },
        pressed && { opacity: 0.85 },
      ]}
    >
      {/* moulures selon le palier d'aspect */}
      {lv >= 1 ? <View style={styles.trim} /> : null}
      {lv >= 2 ? <View style={[styles.trim, { top: 4, borderColor: colors.gold }]} /> : null}

      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {seatIcon(station)} {stationName(station)}
        </Text>
        <Text style={styles.level}>Niv. {station.level}</Text>
        {crowded ? <View style={styles.badge} /> : null}
      </View>

      {sorting ? (
        <View style={styles.hatRow}>
          <Hat size={52} talking={sortingBusy} />
          {sortingBusy ? <ThinkingCrests size={40} /> : null}
        </View>
      ) : null}

      <View style={styles.seats}>
        {station.seats.map((seat, i) => {
          const s = seat.occupant !== null ? game.students[seat.occupant] : undefined;
          return (
            <View key={i} style={styles.seat}>
              {s ? (
                <Chibi student={s} size={SEAT - 6} sleeping={station.kind === 'dorm'} />
              ) : (
                <Text style={styles.seatEmpty}>{seatIcon(station)}</Text>
              )}
              {s && seat.total > 0 ? (
                <Bar value={1 - seat.remaining / seat.total} height={3} color={colors.candle} />
              ) : (
                <View style={{ height: 3 }} />
              )}
              {seat.level > 1 ? (
                <Text style={styles.stars}>{'★'.repeat(seat.level - 1)}</Text>
              ) : null}
            </View>
          );
        })}
      </View>
      {station.kind === 'dorm' && station.seats.some((x) => x.occupant !== null) ? (
        <Text style={styles.zzz}>Zzz</Text>
      ) : null}

      <View style={styles.queue}>
        {station.queue.slice(0, MAX_QUEUE_SHOWN).map((id) => {
          const s = game.students[id];
          return s ? <Chibi key={id} student={s} size={18} /> : null;
        })}
        {station.queue.length > MAX_QUEUE_SHOWN ? (
          <Text style={styles.more}>+{station.queue.length - MAX_QUEUE_SHOWN}</Text>
        ) : null}
        <View style={{ flex: 1 }} />
        <Text style={[styles.wait, crowded && { color: '#FFB3A7' }]}>
          👥 {station.queue.length} · ⏳ {formatDuration(wait)}
        </Text>
      </View>

      {floaters.map((f) => (
        <FloatText key={f.key} text={f.text} color={f.color} offset={(f.key % 7) / 7} />
      ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  room: {
    margin: 3,
    padding: space.sm,
    borderRadius: radius.sm,
    borderWidth: 3,
    borderColor: colors.woodDark,
    minHeight: 120,
    overflow: 'hidden',
  },
  trim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: 'rgba(255,216,107,0.35)',
    borderRadius: 2,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  name: { flex: 1, color: colors.parchment, fontWeight: '800', fontSize: 13 },
  level: { color: colors.candle, fontWeight: '700', fontSize: 11 },
  badge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4D3D',
    marginLeft: 4,
    borderWidth: 1,
    borderColor: colors.white,
  },
  hatRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  seats: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  seat: {
    width: SEAT,
    height: SEAT + 6,
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 4,
    paddingBottom: 1,
  },
  seatEmpty: { fontSize: 14, opacity: 0.45, marginBottom: 4 },
  stars: { position: 'absolute', top: -1, right: 1, fontSize: 7, color: colors.candle },
  zzz: {
    position: 'absolute',
    right: 8,
    top: 26,
    color: '#CFE3FF',
    fontWeight: '900',
    fontStyle: 'italic',
  },
  queue: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    minHeight: 20,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  more: { color: colors.parchment, fontSize: 11, fontWeight: '700', marginLeft: 2 },
  wait: { color: colors.parchment, fontSize: 11, fontWeight: '600' },
});
