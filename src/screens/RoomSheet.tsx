import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PORTRAITS } from '../assets/portraits';
import { COURSES, type CourseId } from '../data/courses';
import { ECONOMY } from '../data/economy';
import { HOUSE_IDS, HOUSES } from '../data/houses';
import { MANAGERS } from '../data/managers';
import { PLOT } from '../data/layout';
import { NAMED_PROFESSORS, professorLabel, professorTitle } from '../data/professors';
import { SERVICES, type UpgradeTrack } from '../data/stations';
import {
  addSeatCost,
  comfortOf,
  courseCost,
  courseReward,
  dormCost,
  estimatedWait,
  isClosed,
  levelUpCost,
  managerCost,
  optimizeStation,
  receptionPatience,
  ROOM_ZONE,
  seatUpgradeCost,
  serviceTime,
  storageCap,
  trackCost,
  type Purchase,
  type Station,
} from '../engine';
import { t } from '../i18n';
import { Crest } from '../ui/Crest';
import { seatPos } from '../ui/iso';
import { Body, BuyButton, Chip, Stat, stationName, Title } from '../ui/kit';
import { colors, formatDuration, formatNumber, radius, space, TOUCH } from '../ui/theme';
import { useGame, useTick } from '../state/store';

function seatName(st: Station): string {
  const key =
    st.kind === 'course'
      ? COURSES[st.courseId!].seatKey
      : st.kind === 'reception'
        ? 'counter'
        : SERVICES[st.kind].seatKey;
  return t(`seat.${key}`);
}

function effectText(tr: UpgradeTrack): string {
  const v = tr.effect.type === 'time' ? Math.round(tr.effect.perLevel * 100) : tr.effect.perLevel;
  return t(`effect.${tr.effect.type}`, { v });
}

function describe(st: Station, p: Purchase): string {
  switch (p.kind) {
    case 'levelUp':
      return t('room.levelUp');
    case 'addSeat':
      return t('room.addSeat', { seat: seatName(st) });
    case 'seat':
      return `${seatName(st)} n°${p.seat + 1} ★`;
    case 'track':
      return t(`track.${p.trackId}`);
    default:
      return '';
  }
}

const GRID_PX = 264;
const ROOM = PLOT.size;

/** Plan vu de dessus pour déplacer les places dans la zone de la salle. */
function RearrangeGrid({ st }: { st: Station }) {
  const [sel, setSel] = useState<number | null>(null);
  const cell = GRID_PX / ROOM;
  const snap = (v: number) => Math.round(v * 2) / 2;
  const onPlace = (px: number, py: number) => {
    if (sel === null) return;
    const x = Math.min(ROOM_ZONE.max, Math.max(ROOM_ZONE.min, snap(px / cell)));
    const y = Math.min(ROOM_ZONE.max, Math.max(ROOM_ZONE.min, snap(py / cell)));
    if (useGame.getState().moveSeat(st.id, sel, x, y)) setSel(null);
  };
  return (
    <View style={{ alignItems: 'center', marginVertical: space.sm }}>
      <Body style={styles.hint}>{t('room.rearrangeHint')}</Body>
      <Pressable
        onPress={(e) => onPlace(e.nativeEvent.locationX, e.nativeEvent.locationY)}
        style={[styles.plan, { width: GRID_PX, height: GRID_PX }]}
      >
        {Array.from({ length: ROOM - 1 }, (_, i) => (
          <View
            key={`v${i}`}
            pointerEvents="none"
            style={[styles.planLine, { left: (i + 1) * cell, top: 0, width: 1, height: GRID_PX }]}
          />
        ))}
        {Array.from({ length: ROOM - 1 }, (_, i) => (
          <View
            key={`h${i}`}
            pointerEvents="none"
            style={[styles.planLine, { top: (i + 1) * cell, left: 0, height: 1, width: GRID_PX }]}
          />
        ))}
        <View
          pointerEvents="none"
          style={[styles.door, { top: (ROOM / 2) * cell - 14, right: -4 }]}
        />
        {st.seats.map((seat, i) => {
          const p = seatPos(st.kind, i, seat.pos);
          return (
            <Pressable
              key={i}
              onPress={() => setSel(sel === i ? null : i)}
              style={[
                styles.planSeat,
                { left: p.x * cell - 15, top: p.y * cell - 15 },
                sel === i && styles.planSeatSel,
              ]}
            >
              <Text style={styles.planSeatText}>{i + 1}</Text>
            </Pressable>
          );
        })}
      </Pressable>
    </View>
  );
}

export function RoomSheet() {
  useTick();
  const id = useGame((s) => s.selected);
  const game = useGame((s) => s.game);
  const store = useGame.getState();
  const [seatSel, setSeatSel] = useState<number | null>(null);
  const [rearrange, setRearrange] = useState(false);
  const st = id ? game.stations[id] : undefined;
  if (id && !st) return <BuildSheet id={id} />;
  if (!st) return null;

  const coins = game.coins;
  const best = optimizeStation(game, st);
  const isCourse = st.kind === 'course';
  const levelSub = isCourse
    ? `−${ECONOMY.level.timePerLevel * 100} % durée, +${ECONOMY.level.coinPerLevel * 100} % gains, +1 place / ${ECONOMY.level.seatEveryLevels} niv.`
    : `−${ECONOMY.level.timePerLevel * 100} % durée, +1 place / ${ECONOMY.level.seatEveryLevels} niv.`;

  const close = () => {
    setSeatSel(null);
    setRearrange(false);
    store.select(null);
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} />
      <View style={styles.sheet}>
        <View style={styles.head}>
          <Title style={{ flex: 1 }}>{stationName(st)}</Title>
          <Text style={styles.lvl}>{t('room.level', { n: st.level })}</Text>
          <Pressable onPress={close} style={styles.close} accessibilityLabel={t('room.close')}>
            <Text style={{ fontSize: 22 }}>✕</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: space.xl }}>
          {isCourse && NAMED_PROFESSORS[st.courseId!] ? (
            <View style={styles.profRow}>
              {PORTRAITS[st.courseId!] ? (
                <Image
                  source={PORTRAITS[st.courseId!]!}
                  style={styles.portrait}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
              ) : null}
              <Text style={[styles.prof, { flex: 1 }]}>
                {professorTitle(NAMED_PROFESSORS[st.courseId!]!)}
                {'\n'}
                <Text style={styles.profName}>
                  {professorLabel(NAMED_PROFESSORS[st.courseId!]!)}
                </Text>
              </Text>
            </View>
          ) : null}
          {isClosed(game, st) ? <Text style={styles.closed}>💥 {t('room.closed')}</Text> : null}
          <View style={styles.stats}>
            <Stat label={t('room.queue')} value={String(st.queue.length)} />
            <Stat label={t('room.avgWait')} value={formatDuration(st.stats.avgWait)} />
            <Stat
              label={t('room.duration')}
              value={formatDuration(serviceTime(st, 0, undefined, game))}
            />
            <Stat label={t('room.seats')} value={String(st.seats.length)} />
          </View>
          <View style={styles.stats}>
            {isCourse ? (
              <Stat
                label={t('room.reward')}
                value={`${courseReward(st, { house: null, mood: 100 }, game)} 💰`}
              />
            ) : (
              <Stat label={t('room.comfort')} value={String(comfortOf(st))} />
            )}
            {st.kind === 'reception' ? (
              <Stat label={t('room.patience')} value={formatDuration(receptionPatience(game))} />
            ) : null}
            <Stat label={t('room.served')} value={String(st.stats.served)} />
            {st.kind === 'reception' ? (
              <Stat label={t('room.left')} value={String(st.stats.left)} />
            ) : null}
            <Stat label="⏳" value={formatDuration(estimatedWait(st))} />
          </View>

          {isCourse ? (
            <>
              {game.managers[st.id] ? (
                <View style={styles.manager}>
                  <Text style={styles.managerText}>
                    👔 {t('room.managerHired', { name: MANAGERS[st.courseId!] })}
                  </Text>
                  <Text style={styles.hintSmall}>{t('room.managerSub')}</Text>
                </View>
              ) : (
                <>
                  <Pressable
                    style={[styles.collect, st.pending < 1 && { opacity: 0.5 }]}
                    onPress={() => store.collect(st.id)}
                  >
                    <Text style={styles.collectText}>
                      💰 {t('room.collect')} {formatNumber(st.pending)} /{' '}
                      {formatNumber(storageCap(st))}
                    </Text>
                  </Pressable>
                  <BuyButton
                    icon="👔"
                    label={`${t('room.manager')} : ${MANAGERS[st.courseId!]}`}
                    sub={t('room.managerSub')}
                    cost={managerCost(game, st.id)}
                    coins={coins}
                    onPress={() => store.hireManager(st.id)}
                  />
                </>
              )}
            </>
          ) : null}

          {best ? (
            <BuyButton
              icon="✨"
              label={`${t('room.optimize')} : ${describe(st, best)}`}
              cost={best.cost}
              coins={coins}
              onPress={() => store.buy(best)}
              style={{ borderColor: colors.gold, borderWidth: 3 }}
            />
          ) : (
            <Body style={styles.hint}>✨ {t('room.optimizeNone')}</Body>
          )}

          <BuyButton
            icon="⬆️"
            label={t('room.levelUp')}
            sub={levelSub}
            cost={levelUpCost(st)}
            coins={coins}
            onPress={() => store.levelUp(st.id)}
          />
          <BuyButton
            icon="➕"
            label={t('room.addSeat', { seat: seatName(st) })}
            sub="File d’attente plus courte"
            cost={addSeatCost(st)}
            coins={coins}
            onPress={() => store.addSeat(st.id)}
          />

          <View style={styles.sectionRow}>
            <Text style={[styles.section, { flex: 1 }]}>{t('room.seatsTitle')}</Text>
            <Chip
              label={rearrange ? t('room.rearrangeDone') : `🧭 ${t('room.rearrange')}`}
              active={rearrange}
              onPress={() => setRearrange(!rearrange)}
            />
          </View>
          {rearrange ? (
            <RearrangeGrid st={st} />
          ) : (
            <View style={styles.seatGrid}>
              {st.seats.map((seat, i) => (
                <Pressable
                  key={i}
                  onPress={() => setSeatSel(i)}
                  onLongPress={() => store.upgradeSeat(st.id, i)}
                  style={[styles.seatCell, seatSel === i && { borderColor: colors.gold }]}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700' }}>{i + 1}</Text>
                  <Text style={{ fontSize: 10, color: colors.goldDark }}>
                    {'★'.repeat(seat.level)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          {!rearrange && seatSel !== null && st.seats[seatSel] ? (
            <BuyButton
              icon="⭐"
              label={`${t('room.seatUpgrade')} (n°${seatSel + 1})`}
              sub={`−${ECONOMY.seatUpgrade.timePerLevel * 100} % de temps${isCourse ? `, −${ECONOMY.seatUpgrade.failPerLevel * 100} % d’échec` : ''}`}
              cost={seatUpgradeCost(st, seatSel)}
              coins={coins}
              onPress={() => store.upgradeSeat(st.id, seatSel)}
            />
          ) : null}

          {st.kind !== 'course' && SERVICES[st.kind].tracks.length ? (
            <>
              <Text style={styles.section}>{t('room.upgradesTitle')}</Text>
              {SERVICES[st.kind].tracks.map((tr) => (
                <BuyButton
                  key={tr.id}
                  icon={tr.icon}
                  label={`${t(`track.${tr.id}`)} (${st.tracks[tr.id] ?? 0}/${tr.maxLevel})`}
                  sub={effectText(tr)}
                  cost={trackCost(st, tr.id)}
                  coins={coins}
                  onPress={() => store.upgradeTrack(st.id, tr.id)}
                />
              ))}
            </>
          ) : null}

          {st.kind === 'sorting' ? (
            <>
              <Text style={styles.section}>{t('room.bias')}</Text>
              {st.level < 5 ? <Body style={styles.hint}>🔒 {t('room.biasLocked')}</Body> : null}
              <View style={styles.biasRow}>
                <Chip
                  label={t('room.biasNone')}
                  active={game.sortingBias === null}
                  onPress={() => store.setBias(null)}
                />
                {HOUSE_IDS.map((h) => (
                  <Pressable
                    key={h}
                    disabled={st.level < 5}
                    onPress={() => store.setBias(h)}
                    style={[
                      styles.biasCrest,
                      game.sortingBias === h && {
                        borderColor: HOUSES[h].color,
                        backgroundColor: HOUSES[h].light,
                      },
                      st.level < 5 && { opacity: 0.4 },
                    ]}
                  >
                    <Crest house={h} size={32} />
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

/** Parcelle vide : construire une salle de cours ou un dortoir. */
function BuildSheet({ id }: { id: string }) {
  useTick();
  const game = useGame((s) => s.game);
  const store = useGame.getState();
  const close = () => store.select(null);
  const isCourse = id.startsWith('course-');
  const cid = id.slice(7) as CourseId;
  const def = isCourse ? COURSES[cid] : null;
  const title = def ? `${def.icon} ${t(`course.${cid}`)}` : `🛏️ ${t('shop.newDorm')}`;
  const buy = () => {
    const ok = def ? store.buyCourse(cid) : store.buyDorm();
    if (ok) store.select(id);
  };
  return (
    <Modal visible animationType="slide" transparent onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} />
      <View style={styles.sheet}>
        <View style={styles.head}>
          <Title style={{ flex: 1 }}>{title}</Title>
          <Pressable onPress={close} style={styles.close} accessibilityLabel={t('room.close')}>
            <Text style={{ fontSize: 22 }}>✕</Text>
          </Pressable>
        </View>
        {def ? (
          <>
            <View style={styles.stats}>
              <Stat label={t('room.seats')} value={String(def.seats)} />
              <Stat label={t('room.duration')} value={formatDuration(def.duration)} />
              <Stat label={t('room.reward')} value={`${def.reward} 💰`} />
              <Stat label="🎓" value={t('shop.yearMin', { n: def.yearMin })} />
            </View>
            {def.yearMin > 1 ? (
              <Body style={styles.hint}>
                Seuls les élèves de {def.yearMin}e année ou plus peuvent suivre ce cours.
              </Body>
            ) : null}
          </>
        ) : (
          <Body style={styles.hint}>
            4 lits : plus de places de sommeil, et l’école peut accueillir plus d’élèves.
          </Body>
        )}
        <View style={{ marginBottom: space.xl }}>
          <BuyButton
            icon="🔨"
            label={t('shop.buy')}
            cost={def ? courseCost(game, cid) : dormCost(game)}
            coins={game.coins}
            onPress={buy}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    maxHeight: '85%',
    backgroundColor: colors.parchment,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 4,
    borderColor: colors.woodLight,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: space.sm },
  lvl: { fontWeight: '700', color: colors.goldDark, marginRight: space.sm },
  close: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  profRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.parchmentDark,
    borderRadius: radius.md,
    padding: space.sm,
    marginBottom: space.sm,
  },
  portrait: { width: 64, height: 128 },
  prof: { fontWeight: '600', color: colors.inkSoft },
  profName: { fontWeight: '800', fontSize: 17, color: colors.ink },
  closed: { color: colors.bad, fontWeight: '800', textAlign: 'center', marginBottom: space.sm },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.parchmentDark,
    borderRadius: radius.md,
    marginBottom: space.sm,
  },
  section: {
    marginTop: space.md,
    marginBottom: space.xs,
    fontWeight: '800',
    color: colors.inkSoft,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginTop: space.sm },
  hint: { color: colors.inkSoft, marginVertical: space.sm },
  hintSmall: { color: colors.inkSoft, fontSize: 12 },
  collect: {
    minHeight: TOUCH,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: space.xs,
    borderWidth: 2,
    borderColor: colors.goldDark,
  },
  collectText: { fontWeight: '900', color: colors.ink, fontSize: 16 },
  manager: {
    backgroundColor: colors.parchmentDark,
    borderRadius: radius.md,
    padding: space.md,
    marginVertical: space.xs,
  },
  managerText: { fontWeight: '800', color: colors.ink },
  seatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  seatCell: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.woodLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  plan: {
    backgroundColor: '#C9A27A',
    borderWidth: 3,
    borderColor: colors.woodDark,
    borderRadius: 4,
  },
  planLine: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.12)' },
  door: {
    position: 'absolute',
    width: 8,
    height: 28,
    backgroundColor: colors.parchment,
    borderRadius: 2,
  },
  planSeat: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.woodLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.woodDark,
  },
  planSeatSel: {
    backgroundColor: colors.gold,
    borderColor: colors.white,
    transform: [{ scale: 1.15 }],
  },
  planSeatText: { color: colors.white, fontWeight: '900', fontSize: 12 },
  biasRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  biasCrest: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
