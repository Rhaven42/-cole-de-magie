import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { HOUSES } from '../data/houses';
import type { Student } from '../engine';
import { t } from '../i18n';
import { Chibi } from '../ui/Chibi';
import { Crest } from '../ui/Crest';
import { activityLabel, StudentDetails } from './StudentSheet';
import { colors, radius, space } from '../ui/theme';
import { useGame, useTick } from '../state/store';

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
            {t('students.year', { n: s.year })} · {activityLabel(s)}
          </Text>
        </View>
        {s.house ? <Crest house={s.house} size={32} /> : null}
      </View>
      {open ? (
        <View style={styles.details}>
          <StudentDetails s={s} />
        </View>
      ) : null}
    </Pressable>
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
