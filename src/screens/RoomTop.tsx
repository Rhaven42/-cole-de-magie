import { useRef } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SPRITES, type SpriteName } from '../assets';
import { PORTRAITS } from '../assets/portraits';
import { COURSES } from '../data/courses';
import { ECONOMY } from '../data/economy';
import { NAMED_PROFESSORS, professorLabel } from '../data/professors';
import { COURSE_PROPS } from '../data/roomProps';
import { SERVICES } from '../data/stations';
import {
  addSeatCost,
  courseReward,
  levelUpCost,
  maxSeats,
  profLevel,
  propCost,
  slowestSeat,
  speedUpgradeCost,
  serviceTime,
  type GameState,
  type Station,
} from '../engine';
import { useGame } from '../state/store';
import { stationName } from '../ui/kit';
import { formatDuration, formatNumber, radius, space } from '../ui/theme';

/** Sprite représentatif d'une salle (son poste de travail). */
const ROOM_ICON: Record<string, string> = {
  potions: 'cauldron',
  botany: 'plant',
  history: 'desk',
  charms: 'stage',
  astronomy: 'telescope',
  flying: 'broom',
  divination: 'crystal',
  transfiguration: 'podium',
  defense: 'dummy',
  duel: 'duelCircle',
  reception: 'counter',
  sorting: 'hat',
  hall: 'table',
  dorm: 'bed',
  exam: 'desk',
};

/** Bouton vert « Améliorer » avec son prix (gris si trop cher, « Max » si plafonné). */
export function UpgradeButton({
  cost,
  coins,
  onPress,
  label = 'Améliorer',
}: {
  cost: number | null;
  coins: number;
  onPress: () => void;
  label?: string;
}) {
  const ok = cost !== null && coins >= cost;
  // Anti double appui : un achat à la fois, même en tapotant très vite.
  const last = useRef(0);
  const press = () => {
    const now = Date.now();
    if (now - last.current < 180) return;
    last.current = now;
    onPress();
  };
  return (
    <Pressable
      accessibilityRole="button"
      onPress={ok ? press : undefined}
      style={({ pressed }) => [
        styles.btn,
        !ok && styles.btnOff,
        pressed && ok && { transform: [{ scale: 0.97 }] },
      ]}
    >
      <Text style={styles.btnLabel}>{cost === null ? 'Maximum' : label}</Text>
      {cost !== null ? <Text style={styles.btnCost}>💰 {formatNumber(cost)}</Text> : null}
    </Pressable>
  );
}

/** Haut de la fiche : carte de niveau, panneaux places / chrono, emplacements d'objets, prof. */
export function RoomTop({ st, game }: { st: Station; game: GameState }) {
  const store = useGame.getState();
  const coins = game.coins;
  const isCourse = st.kind === 'course';
  const key = isCourse ? st.courseId! : st.kind;
  const icon = SPRITES[(ROOM_ICON[key] ?? 'chest') as SpriteName];
  const who = { house: null, mood: 100 };
  const reward = isCourse ? courseReward(st, who, game) : 0;
  const next = isCourse ? courseReward({ ...st, level: st.level + 1 }, who, game) : 0;
  // Durée moyenne des places : chaque appui sur le chrono la fait baisser.
  const duration = st.seats.length
    ? st.seats.reduce((a, _, i) => a + serviceTime(st, i, undefined, game), 0) / st.seats.length
    : serviceTime(st, 0, undefined, game);
  const target = st.seats.length ? slowestSeat(st) : -1;
  const max = maxSeats(st);
  // Chrono : améliore la place la plus lente (la moins améliorée).
  const prof = isCourse ? NAMED_PROFESSORS[st.courseId!] : undefined;
  const props = isCourse ? (COURSE_PROPS[st.courseId!] ?? []) : [];
  const desc = isCourse
    ? `${COURSES[st.courseId!].icon} ${formatDuration(COURSES[st.courseId!].duration)} de cours · ${COURSES[st.courseId!].xp} XP`
    : `${SERVICES[st.kind as Exclude<Station['kind'], 'course'>].icon} ${st.seats.length} ${st.seats.length > 1 ? 'places' : 'place'}`;

  return (
    <View>
      {/* Carte principale : niveau et gains */}
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconBox}>
            {icon ? <Image source={icon.src} style={styles.icon} resizeMode="contain" /> : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{stationName(st)}</Text>
            {isCourse ? (
              <Text style={styles.fee}>
                Gain par élève : <Text style={styles.feeValue}>💰 {formatNumber(reward)}</Text>
              </Text>
            ) : null}
            <Text style={styles.desc}>{desc}</Text>
          </View>
        </View>
        <View style={styles.dashed} />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            {isCourse && next > reward ? (
              <Text style={styles.nextText}>Suivant : +{formatNumber(next - reward)} 💰</Text>
            ) : (
              <Text style={styles.nextText}>
                −{Math.round(ECONOMY.level.timePerLevel * 100)} % de durée par niveau
              </Text>
            )}
            <View style={styles.bar}>
              <View
                style={[styles.barFill, { width: `${(st.level / ECONOMY.maxLevel) * 100}%` }]}
              />
              <Text style={styles.barText}>NIV. {st.level}</Text>
            </View>
          </View>
          <UpgradeButton
            cost={levelUpCost(st)}
            coins={coins}
            onPress={() => store.levelUp(st.id)}
          />
        </View>
      </View>

      {/* Places et chrono */}
      <View style={styles.panels}>
        <View style={[styles.panel, { flex: 1 }]}>
          <Text style={styles.panelTitle}>
            {st.seats.length} {st.seats.length > 1 ? 'Places' : 'Place'}
          </Text>
          <View style={styles.seatGrid}>
            {Array.from({ length: Math.min(max, 12) }, (_, i) => {
              const seat = st.seats[i];
              return (
                <View
                  key={i}
                  style={[
                    styles.seat,
                    seat ? styles.seatOn : styles.seatOff,
                    seat?.occupant !== null && seat ? styles.seatBusy : null,
                  ]}
                >
                  <Text style={{ fontSize: 10 }}>{seat ? '👤' : ''}</Text>
                </View>
              );
            })}
          </View>
          <UpgradeButton
            cost={addSeatCost(st)}
            coins={coins}
            onPress={() => store.addSeat(st.id)}
          />
        </View>
        <View style={[styles.panel, { flex: 1 }]}>
          <View style={styles.clock}>
            <View style={styles.clockKnob} />
            <Text style={styles.clockText}>{duration.toFixed(1)} s</Text>
            <Text style={styles.clockSub}>moyenne</Text>
          </View>
          {target >= 0 ? (
            <Text style={styles.clockTarget}>
              Place n°{target + 1} · niv. {st.seats[target].level}
            </Text>
          ) : null}
          <UpgradeButton
            cost={speedUpgradeCost(st)}
            coins={coins}
            onPress={() => store.upgradeSpeed(st.id)}
          />
        </View>
      </View>

      {/* Emplacements d'objets spéciaux */}
      {props.length ? (
        <View style={styles.slots}>
          {props.map((p) => {
            const owned = !p.cost || (st.props ?? []).includes(p.id);
            const cost = owned ? null : propCost(st, p.id);
            const can = cost !== null && coins >= cost;
            const sp = SPRITES[p.sprite as SpriteName];
            return (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                accessibilityLabel={p.name}
                onPress={can ? () => store.buyProp(st.id, p.id) : undefined}
                style={[styles.slot, owned ? styles.slotOwned : can ? styles.slotCan : null]}
              >
                {sp ? (
                  <Image
                    source={sp.src}
                    style={[styles.slotImg, !owned && { opacity: 0.35 }]}
                    resizeMode="contain"
                  />
                ) : null}
                {owned ? null : (
                  <Text style={styles.slotCost}>
                    {can ? '➕' : '🔒'} {formatNumber(cost ?? 0)}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {props.length ? (
        <Text style={styles.slotHint}>
          Objets spéciaux : touchez un emplacement pour l’installer (+6 % / +10 % d’Éclats).
        </Text>
      ) : null}

      {/* Le prof de la salle */}
      {prof ? (
        <Pressable style={styles.profCard} onPress={() => store.select('staff')}>
          {PORTRAITS[st.courseId!] ? (
            <Image source={PORTRAITS[st.courseId!]!} style={styles.prof} resizeMode="contain" />
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={styles.profName}>{professorLabel(prof)}</Text>
            {prof.trait ? <Text style={styles.profTrait}>« {prof.trait} »</Text> : null}
            <Text style={styles.profLvl}>
              Niv. {profLevel(game, st.courseId!)} · Salle des profs ›
            </Text>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const PAPER = '#F3E3BF';
const BORDER = '#D8BE8A';
const styles = StyleSheet.create({
  card: {
    backgroundColor: PAPER,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: BORDER,
    padding: space.sm,
    marginBottom: space.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  iconBox: {
    width: 74,
    height: 74,
    borderRadius: radius.sm,
    backgroundColor: '#E6CFA0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: 62, height: 62 },
  cardTitle: { fontWeight: '900', fontSize: 16, color: '#4A2E16' },
  fee: { color: '#6B4A2A', fontWeight: '700', marginTop: 2 },
  feeValue: { color: '#C77A10', fontWeight: '900' },
  desc: { color: '#7A6446', fontSize: 12, marginTop: 2 },
  dashed: {
    borderBottomWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: BORDER,
    marginVertical: space.sm,
  },
  nextText: { color: '#6B4A2A', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  bar: {
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E6CFA0',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  barFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#E07B2E' },
  barText: { marginLeft: 8, fontSize: 10, fontWeight: '900', color: '#4A2E16' },
  btn: {
    minWidth: 104,
    backgroundColor: '#5FAE3A',
    borderRadius: radius.sm,
    borderBottomWidth: 3,
    borderColor: '#3D7A22',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  btnOff: { backgroundColor: '#9A9EA2', borderColor: '#73777B' },
  btnLabel: { color: '#fff', fontWeight: '900', fontSize: 15 },
  btnCost: { color: '#FFF3C4', fontWeight: '800', fontSize: 12 },
  panels: { flexDirection: 'row', gap: space.sm, marginBottom: space.sm },
  panel: {
    backgroundColor: PAPER,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: BORDER,
    padding: space.sm,
    alignItems: 'center',
    gap: space.sm,
  },
  panelTitle: { fontWeight: '900', fontSize: 16, color: '#4A2E16' },
  seatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
    width: 104,
  },
  seat: {
    width: 22,
    height: 22,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  seatOn: { backgroundColor: '#F6E27A', borderColor: '#C9A23A' },
  seatBusy: { backgroundColor: '#FFD23F' },
  seatOff: { backgroundColor: '#7A5A3A', borderColor: '#5A3E22' },
  clock: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 6,
    borderColor: '#C9A25A',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF6E0',
  },
  clockKnob: {
    position: 'absolute',
    top: -12,
    width: 16,
    height: 10,
    borderRadius: 3,
    backgroundColor: '#C9A25A',
  },
  clockText: { fontWeight: '900', fontSize: 18, color: '#4A2E16' },
  clockSub: { fontSize: 9, color: '#7A6446', fontWeight: '700' },
  clockTarget: { fontSize: 11, color: '#6B4A2A', fontWeight: '800', marginTop: -4 },
  slots: {
    flexDirection: 'row',
    gap: space.sm,
    backgroundColor: PAPER,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: BORDER,
    padding: space.sm,
    flexWrap: 'wrap',
  },
  slot: {
    width: 62,
    height: 62,
    borderRadius: radius.sm,
    backgroundColor: '#B98A5A',
    borderWidth: 2,
    borderColor: '#8A5A2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotOwned: { backgroundColor: '#E6CFA0', borderColor: '#C9A25A' },
  slotCan: { borderColor: '#5FAE3A', borderWidth: 3 },
  slotImg: { width: 50, height: 50 },
  slotCost: {
    position: 'absolute',
    bottom: 2,
    fontSize: 9,
    fontWeight: '900',
    color: '#FFF3C4',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 3,
    borderRadius: 3,
  },
  slotHint: { fontSize: 11, color: '#7A6446', marginTop: 4, marginBottom: space.sm },
  profCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: '#3E4A6B',
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: '#C9A25A',
    padding: space.sm,
    marginBottom: space.sm,
  },
  prof: { width: 46, height: 84 },
  profName: { color: '#FFF3D6', fontWeight: '900' },
  profTrait: { color: '#D9C7A0', fontStyle: 'italic', fontSize: 12 },
  profLvl: { color: '#FFD86B', fontWeight: '800', fontSize: 12, marginTop: 2 },
});
