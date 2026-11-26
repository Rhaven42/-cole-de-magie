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
      <Text style={styles.item} accessibilityLabel={t('currency.gems')}>
        💎 {game.gems}
      </Text>
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
});
