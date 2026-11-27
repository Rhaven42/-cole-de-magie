import { Pressable, StyleSheet, Text, View } from 'react-native';
import { populationCap, reputationStars } from '../engine';
import { t } from '../i18n';
import { useGame, useTick } from '../state/store';
import { colors, formatNumber, space } from './theme';

export function Hud() {
  useTick();
  const game = useGame((s) => s.game);
  const stars = reputationStars(game.reputation);
  const n = Object.keys(game.students).length;
  const daily = useGame((s) => s.dailyAvailable);
  return (
    <View style={styles.bar}>
      <Text style={styles.item} accessibilityLabel={t('currency.coins')}>
        💰 {formatNumber(game.coins)}
      </Text>
      <Pressable
        onPress={() => useGame.getState().openPanel('gems')}
        accessibilityRole="button"
        accessibilityLabel={t('currency.gems')}
        style={styles.gems}
      >
        <Text style={styles.item}>💎 {game.gems}</Text>
        <Text style={styles.plus}>+</Text>
      </Pressable>
      <Text style={styles.item} accessibilityLabel={t('hud.reputation')}>
        {'★'.repeat(stars)}
        <Text style={{ color: 'rgba(255,255,255,0.3)' }}>{'★'.repeat(Math.max(0, 5 - stars))}</Text>
      </Text>
      {daily ? (
        <Pressable
          onPress={() => useGame.getState().setDailyOpen(true)}
          accessibilityLabel={t('daily.title')}
        >
          <Text style={styles.gift}>🎁</Text>
        </Pressable>
      ) : null}
      <Text style={styles.item} accessibilityLabel={t('hud.students')}>
        🎓 {n}/{populationCap(game)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    backgroundColor: colors.woodDark,
    borderBottomWidth: 3,
    borderBottomColor: colors.goldDark,
  },
  item: { color: colors.candle, fontWeight: '800', fontSize: 15 },
  gift: { fontSize: 22 },
  gems: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(127,211,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  plus: {
    color: '#fff',
    backgroundColor: '#3A9FD9',
    borderRadius: 8,
    width: 16,
    height: 16,
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 12,
    lineHeight: 16,
    overflow: 'hidden',
  },
});
