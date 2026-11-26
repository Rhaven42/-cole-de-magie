import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RELIC_SETS, RELICS } from '../data/collection';
import { ENVIRONMENTS, PRESTIGE } from '../data/environments';
import { EVENTS } from '../data/events';
import { CAREER_IDS, CAREERS } from '../data/progression';
import {
  bottleneck,
  canPrestige,
  completeSets,
  donationsPerMin,
  estimatedWait,
  metaCoinMult,
  nextEnvironment,
  prestigeRequirement,
  relicCount,
} from '../engine';
import { t } from '../i18n';
import { Crest } from '../ui/Crest';
import { Bar, stationName, Title } from '../ui/kit';
import { colors, formatDuration, formatNumber, radius, space, TOUCH } from '../ui/theme';
import { useGame, useTick } from '../state/store';
import { SettingsScreen } from './SettingsScreen';

type Page = 'menu' | 'report' | 'collection' | 'alumni' | 'prestige' | 'settings';

function Back({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.back}>
      <Text style={styles.backText}>‹ {t('tab.more')}</Text>
    </Pressable>
  );
}

function Report() {
  useTick();
  const game = useGame((s) => s.game);
  const history = useGame((s) => s.history);
  const first = history[0];
  const last = history[history.length - 1];
  const minutes = first && last && last.at > first.at ? (last.at - first.at) / 60000 : 0;
  const perMin = minutes > 0 ? (last.total - first.total) / minutes : 0;
  const rooms = Object.values(game.stations)
    .filter((s) => s.kind === 'course')
    .map((s) => ({
      s,
      rate:
        minutes > 0 ? ((last.byStation[s.id] ?? 0) - (first.byStation[s.id] ?? 0)) / minutes : 0,
    }))
    .sort((a, b) => b.rate - a.rate);
  const maxRate = Math.max(1, ...rooms.map((r) => r.rate));
  const neck = bottleneck(game);
  const wait = estimatedWait(neck);
  const byYear = Array.from(
    { length: 7 },
    (_, i) => Object.values(game.students).filter((s) => s.year === i + 1).length,
  );
  const active = game.events.filter((e) => e.until > game.time);
  return (
    <View style={{ gap: space.md }}>
      <Title>📊 {t('report.title')}</Title>
      <View style={styles.card}>
        <Text style={styles.big}>{formatNumber(perMin)} 💰</Text>
        <Text style={styles.sub}>{t('report.income')} (dernière minute)</Text>
        <Text style={styles.sub}>
          + {t('report.donations')} : {formatNumber(donationsPerMin(game))}/min
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.h}>
          {wait > 15
            ? `⚠️ ${t('report.neck', { place: stationName(neck), wait: formatDuration(wait) })}`
            : `✅ ${t('report.noNeck')}`}
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.h}>{t('report.rooms')}</Text>
        {rooms.map(({ s, rate }) => (
          <View key={s.id} style={styles.rowLine}>
            <Text style={styles.rowLabel} numberOfLines={1}>
              {stationName(s)}
            </Text>
            <View style={{ flex: 1 }}>
              <Bar value={rate / maxRate} height={10} />
            </View>
            <Text style={styles.rowVal}>{formatNumber(rate)}/min</Text>
          </View>
        ))}
      </View>
      <View style={styles.card}>
        <Text style={styles.h}>{t('report.population')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 70, gap: 6 }}>
          {byYear.map((n, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.sub}>{n}</Text>
              <View
                style={{
                  width: '100%',
                  height: Math.max(2, (n / Math.max(1, ...byYear)) * 44),
                  backgroundColor: colors.woodLight,
                  borderRadius: 3,
                }}
              />
              <Text style={styles.sub}>{i + 1}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.h}>{t('report.events')}</Text>
        <Text style={styles.sub}>
          {active.length
            ? active
                .map((e) => `${EVENTS[e.id].icon} ${formatDuration(e.until - game.time)}`)
                .join('  ')
            : t('report.none')}
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.h}>{t('report.totals')}</Text>
        <Text style={styles.sub}>
          {t('report.collected')} : {formatNumber(game.totals.coinsEarned)}
        </Text>
        <Text style={styles.sub}>
          {t('report.courses')} : {formatNumber(game.totals.coursesPassed)}
        </Text>
        <Text style={styles.sub}>
          {t('report.graduates')} : {game.totals.graduated}
        </Text>
      </View>
    </View>
  );
}

function Collection() {
  useTick();
  const game = useGame((s) => s.game);
  const bonus = Math.round((1 + relicCount(game) * 0.01 + completeSets(game) * 0.05 - 1) * 100);
  return (
    <View style={{ gap: space.md }}>
      <Title>🏺 {t('collection.title')}</Title>
      <Text style={styles.sub}>{t('collection.bonus', { n: bonus })}</Text>
      <Text style={styles.sub}>{t('collection.hint')}</Text>
      {RELIC_SETS.map((set) => {
        const items = RELICS.filter((r) => r.set === set);
        const done = items.every((r) => (game.meta.relics[r.id] ?? 0) > 0);
        return (
          <View
            key={set}
            style={[styles.card, done && { borderColor: colors.gold, borderWidth: 3 }]}
          >
            <Text style={styles.h}>
              {t(`collection.set.${set}`)} {done ? `— ${t('collection.complete')}` : ''}
            </Text>
            <View style={styles.relicRow}>
              {items.map((r) => {
                const n = game.meta.relics[r.id] ?? 0;
                return (
                  <View key={r.id} style={[styles.relic, n === 0 && { opacity: 0.35 }]}>
                    <Text style={{ fontSize: 28 }}>{n > 0 ? r.icon : '❔'}</Text>
                    <Text style={styles.relicName} numberOfLines={2}>
                      {n > 0 ? t(`relic.${r.id}`) : '???'}
                    </Text>
                    {n > 1 ? <Text style={styles.relicCount}>×{n}</Text> : null}
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Alumni() {
  useTick();
  const game = useGame((s) => s.game);
  return (
    <View style={{ gap: space.md }}>
      <Title>🎓 {t('alumni.title')}</Title>
      <Text style={styles.sub}>{t('alumni.intro')}</Text>
      <View style={styles.card}>
        <Text style={styles.h}>
          {t('alumni.donations', { n: formatNumber(donationsPerMin(game)) })}
        </Text>
        <Text style={styles.sub}>{t('alumni.count', { n: game.totals.graduated })}</Text>
      </View>
      <View style={styles.card}>
        {CAREER_IDS.map((id) => (
          <View key={id} style={styles.rowLine}>
            <Text style={{ fontSize: 20 }}>{CAREERS[id].icon}</Text>
            <Text style={[styles.rowLabel, { flex: 1, width: undefined }]}>
              {t(`career.${id}`)}
            </Text>
            <Text style={styles.rowVal}>{game.careers[id] ?? 0}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.h}>{t('alumni.recent')}</Text>
      {game.alumni.length === 0 ? <Text style={styles.sub}>{t('alumni.none')}</Text> : null}
      {game.alumni.map((a, i) => (
        <View key={i} style={[styles.card, styles.rowLine]}>
          {a.house ? <Crest house={a.house} size={28} /> : null}
          <Text style={[styles.rowLabel, { flex: 1, width: undefined }]}>{a.name}</Text>
          <Text style={styles.sub}>
            {CAREERS[a.career].icon} {t(`career.${a.career}`)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function Prestige() {
  useTick();
  const game = useGame((s) => s.game);
  const [confirm, setConfirm] = useState(false);
  const env = ENVIRONMENTS[game.meta.env];
  const next = ENVIRONMENTS[nextEnvironment(game)];
  const need = prestigeRequirement(game);
  const ok = canPrestige(game);
  return (
    <View style={{ gap: space.md }}>
      <Title>🌀 {t('prestige.title')}</Title>
      <Text style={styles.sub}>{t('prestige.intro')}</Text>
      <View style={styles.card}>
        <Text style={styles.h}>
          {env.icon} {t('prestige.current', { env: t(`env.${env.id}`) })}
        </Text>
        <Text style={styles.sub}>
          {t('prestige.bonus', { n: Math.round((metaCoinMult(game) - 1) * 100) })}
        </Text>
      </View>
      <View style={[styles.card, { backgroundColor: next.ground }]}>
        <Text style={[styles.h, { color: colors.white }]}>
          {next.icon} {t('prestige.next', { env: t(`env.${next.id}`) })}
        </Text>
        <Text style={{ color: colors.white }}>
          +{PRESTIGE.coinBonusPerLevel * 100} % d’Éclats pour toujours, +{PRESTIGE.gems} 💎
        </Text>
      </View>
      <Text style={styles.h}>{t('prestige.need', { have: game.totals.graduated, need })}</Text>
      <Bar value={game.totals.graduated / need} height={12} />
      {confirm ? (
        <View style={styles.card}>
          <Text style={styles.h}>{t('prestige.confirm')}</Text>
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
            <Pressable
              style={[styles.btn, { backgroundColor: colors.bad, flex: 1 }]}
              onPress={() => useGame.getState().prestige()}
            >
              <Text style={styles.btnText}>{t('settings.yes')}</Text>
            </Pressable>
            <Pressable style={[styles.btn, { flex: 1 }]} onPress={() => setConfirm(false)}>
              <Text style={styles.btnText}>{t('settings.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          style={[styles.btn, !ok && { opacity: 0.4 }]}
          disabled={!ok}
          onPress={() => setConfirm(true)}
        >
          <Text style={styles.btnText}>
            {next.icon} {t('prestige.go', { env: t(`env.${next.id}`) })}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export function MoreScreen() {
  const [page, setPage] = useState<Page>('menu');
  if (page === 'settings') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.parchmentDark }}>
        <Back onPress={() => setPage('menu')} />
        <SettingsScreen />
      </View>
    );
  }
  const items: { id: Page | 'daily'; icon: string; label: string }[] = [
    { id: 'daily', icon: '🎁', label: t('more.daily') },
    { id: 'report', icon: '📊', label: t('more.report') },
    { id: 'collection', icon: '🏺', label: t('more.collection') },
    { id: 'alumni', icon: '🎓', label: t('more.alumni') },
    { id: 'prestige', icon: '🌀', label: t('more.prestige') },
    { id: 'settings', icon: '⚙️', label: t('tab.settings') },
  ];
  return (
    <ScrollView style={styles.bg} contentContainerStyle={{ padding: space.lg, gap: space.sm }}>
      {page === 'menu' ? (
        items.map((it) => (
          <Pressable
            key={it.id}
            style={styles.menuItem}
            onPress={() =>
              it.id === 'daily' ? useGame.getState().setDailyOpen(true) : setPage(it.id as Page)
            }
          >
            <Text style={{ fontSize: 26 }}>{it.icon}</Text>
            <Text style={styles.menuText}>{it.label}</Text>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        ))
      ) : (
        <>
          <Back onPress={() => setPage('menu')} />
          {page === 'report' && <Report />}
          {page === 'collection' && <Collection />}
          {page === 'alumni' && <Alumni />}
          {page === 'prestige' && <Prestige />}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.parchmentDark },
  back: { minHeight: 44, justifyContent: 'center', paddingHorizontal: space.md },
  backText: { fontWeight: '800', color: colors.woodLight, fontSize: 16 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    backgroundColor: colors.parchment,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    gap: space.md,
    borderWidth: 2,
    borderColor: colors.woodLight,
  },
  menuText: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.ink },
  chev: { fontSize: 24, color: colors.woodLight },
  card: {
    backgroundColor: colors.parchment,
    borderRadius: radius.md,
    padding: space.md,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.woodLight,
  },
  big: { fontSize: 28, fontWeight: '900', color: colors.goldDark },
  h: { fontWeight: '800', color: colors.ink, fontSize: 15 },
  sub: { color: colors.inkSoft, fontSize: 13 },
  rowLine: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 28 },
  rowLabel: { width: 110, fontSize: 12, color: colors.ink, fontWeight: '600' },
  rowVal: { width: 64, textAlign: 'right', fontSize: 12, color: colors.ink, fontWeight: '700' },
  relicRow: { flexDirection: 'row', gap: space.sm },
  relic: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.parchmentDark,
    borderRadius: radius.sm,
    padding: 6,
    minHeight: 90,
  },
  relicName: { fontSize: 10, textAlign: 'center', color: colors.ink },
  relicCount: {
    position: 'absolute',
    top: 2,
    right: 4,
    fontSize: 10,
    fontWeight: '800',
    color: colors.goldDark,
  },
  btn: {
    minHeight: TOUCH,
    borderRadius: radius.md,
    backgroundColor: colors.woodLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
  btnText: { color: colors.white, fontWeight: '800' },
});
