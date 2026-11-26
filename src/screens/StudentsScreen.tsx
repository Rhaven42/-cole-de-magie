import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { HOUSES } from '../data/houses';
import type { Student } from '../engine';
import { t } from '../i18n';
import { Chibi } from '../ui/Chibi';
import { Crest } from '../ui/Crest';
import { Bar, stationName } from '../ui/kit';
import { colors, radius, space } from '../ui/theme';
import { useGame, useTick } from '../state/store';

function activityLabel(s: Student): string {
  const game = useGame.getState().game;
  const a = s.activity;
  if (a.mode === 'free') return t('state.free');
  const st = game.stations[a.stationId];
  const place = st ? stationName(st) : '?';
  return a.mode === 'queue' ? t('state.queue', { place }) : t('state.service', { place });
}

function StudentRow({ s, open, onPress }: { s: Student; open: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, s.house && { borderLeftColor: HOUSES[s.house].color }]}
    >
      <View style={styles.row}>
        <Chibi student={s} size={36} />
        <View style={{ flex: 1, marginLeft: space.sm }}>
          <Text style={styles.name}>{s.name}</Text>
          <Text style={styles.sub}>
            {t(`trait.${s.trait}`)} · {activityLabel(s)}
          </Text>
        </View>
        {s.house ? <Crest house={s.house} size={32} /> : null}
      </View>
      {open ? (
        <View style={styles.details}>
          <Text style={styles.sub}>
            {s.house ? t(`house.${s.house}`) : t('students.unsorted')} ·{' '}
            {t('students.year', { n: s.year })} · {t('students.passed', { n: s.coursesPassed })} ·{' '}
            {s.xp} XP
          </Text>
          <Gauge label={t('students.fatigue')} v={s.fatigue} color="#7FA7D9" />
          <Gauge label={t('students.hunger')} v={Math.min(s.hunger, 100)} color="#E39B4F" />
          <Gauge label={t('students.mood')} v={s.mood} color={colors.good} />
        </View>
      ) : null}
    </Pressable>
  );
}

function Gauge({ label, v, color }: { label: string; v: number; color: string }) {
  return (
    <View style={styles.gauge}>
      <Text style={styles.gaugeLabel}>{label}</Text>
      <View style={{ flex: 1 }}>
        <Bar value={v / 100} color={color} height={8} />
      </View>
      <Text style={styles.gaugeVal}>{Math.round(v)}</Text>
    </View>
  );
}

export function StudentsScreen() {
  useTick();
  const game = useGame((s) => s.game);
  const [open, setOpen] = useState<number | null>(null);
  const list = Object.values(game.students).sort((a, b) => b.arrivedAt - a.arrivedAt);
  return (
    <FlatList
      style={styles.bg}
      contentContainerStyle={{ padding: space.md }}
      data={list}
      keyExtractor={(s) => String(s.id)}
      ListEmptyComponent={<Text style={styles.sub}>{t('students.empty')}</Text>}
      renderItem={({ item }) => (
        <StudentRow
          s={item}
          open={open === item.id}
          onPress={() => setOpen(open === item.id ? null : item.id)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.parchmentDark },
  card: {
    backgroundColor: colors.parchment,
    borderRadius: radius.md,
    padding: space.sm,
    marginBottom: space.sm,
    borderLeftWidth: 6,
    borderLeftColor: colors.disabled,
    minHeight: 56,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { fontWeight: '700', color: colors.ink, fontSize: 15 },
  sub: { color: colors.inkSoft, fontSize: 12 },
  details: { marginTop: space.sm, gap: 4 },
  gauge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gaugeLabel: { width: 60, fontSize: 12, color: colors.inkSoft },
  gaugeVal: { width: 28, textAlign: 'right', fontSize: 12, color: colors.ink },
});
