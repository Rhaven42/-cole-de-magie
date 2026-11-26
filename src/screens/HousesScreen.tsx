import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { HOUSE_CUP, HOUSE_IDS, HOUSES } from '../data/houses';
import { t } from '../i18n';
import { Crest } from '../ui/Crest';
import { Bar, Title } from '../ui/kit';
import { colors, formatDuration, radius, space } from '../ui/theme';
import { useGame, useTick } from '../state/store';

export function HousesScreen() {
  useTick();
  const game = useGame((s) => s.game);
  const pts = game.cup.points;
  const ranking = [...HOUSE_IDS].sort((a, b) => pts[b] - pts[a]);
  const max = Math.max(1, ...HOUSE_IDS.map((h) => pts[h]));
  const counts = Object.fromEntries(HOUSE_IDS.map((h) => [h, 0])) as Record<string, number>;
  for (const s of Object.values(game.students)) if (s.house) counts[s.house]++;
  const left = HOUSE_CUP.seasonSeconds - (game.time - game.cup.seasonStart);

  return (
    <ScrollView style={styles.bg} contentContainerStyle={{ padding: space.lg }}>
      <Title>🏆 {t('cup.title')}</Title>
      <Text style={styles.sub}>
        {t('cup.season', { n: game.cup.season, time: formatDuration(left) })}
      </Text>
      {game.cup.lastWinner ? (
        <Text style={styles.sub}>
          {t('cup.lastWinner', { house: t(`house.${game.cup.lastWinner}`) })}
        </Text>
      ) : null}
      <View style={{ marginTop: space.md }}>
        {ranking.map((h, i) => (
          <View key={h} style={styles.rankRow}>
            <Text style={styles.rank}>{i + 1}</Text>
            <Crest house={h} size={40} />
            <View style={{ flex: 1, marginLeft: space.sm }}>
              <Text style={styles.houseName}>{t(`house.${h}`)}</Text>
              <Bar value={pts[h] / max} color={HOUSES[h].color} height={12} />
            </View>
            <Text style={styles.points}>{t('cup.points', { n: pts[h] })}</Text>
          </View>
        ))}
      </View>
      <Title style={{ marginTop: space.xl }}>Les Maisons</Title>
      {HOUSE_IDS.map((h) => (
        <View
          key={h}
          style={[styles.card, { borderColor: HOUSES[h].color, backgroundColor: HOUSES[h].light }]}
        >
          <Crest house={h} size={56} />
          <View style={{ flex: 1, marginLeft: space.md }}>
            <Text style={styles.houseName}>{t(`house.${h}`)}</Text>
            <Text style={styles.sub}>{t(`house.${h}.trait`)}</Text>
            <Text style={styles.bonus}>✦ {t(`house.${h}.bonus`)}</Text>
            <Text style={styles.sub}>{t('cup.students', { n: counts[h] })}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.parchmentDark },
  sub: { color: colors.inkSoft, fontSize: 13 },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.parchment,
    borderRadius: radius.md,
    padding: space.sm,
    marginBottom: space.sm,
  },
  rank: { width: 24, fontSize: 18, fontWeight: '900', color: colors.goldDark },
  houseName: { fontWeight: '800', fontSize: 16, color: colors.ink, marginBottom: 2 },
  points: { width: 70, textAlign: 'right', fontWeight: '700', color: colors.ink },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 3,
    borderRadius: radius.md,
    padding: space.md,
    marginTop: space.sm,
  },
  bonus: { color: colors.ink, fontWeight: '600', marginVertical: 2 },
});
