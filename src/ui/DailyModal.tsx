import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { DAILY_REWARDS } from '../data/daily';
import { canClaimDaily, dailyCoins, dayNumber, nextDailyIndex } from '../engine';
import { t } from '../i18n';
import { useGame } from '../state/store';
import { colors, formatNumber, radius, space, TOUCH } from './theme';

/** Calendrier de 7 jours de récompenses. */
export function DailyModal() {
  const open = useGame((s) => s.dailyOpen);
  const game = useGame((s) => s.game);
  useGame((s) => s.rev);
  if (!open) return null;
  // eslint-disable-next-line react-hooks/purity
  const today = dayNumber(Date.now());
  const can = canClaimDaily(game, today);
  const idx = can ? nextDailyIndex(game, today) : (game.meta.dailyStreak - 1 + 7) % 7;
  const close = () => useGame.getState().setDailyOpen(false);
  return (
    <Modal transparent animationType="fade" visible onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>🎁 {t('daily.title')}</Text>
          <View style={styles.grid}>
            {DAILY_REWARDS.map((r, i) => {
              const done = can ? i < idx : i <= idx;
              const current = can && i === idx;
              return (
                <View key={i} style={[styles.day, done && styles.done, current && styles.current]}>
                  <Text style={styles.dayLabel}>{t('daily.day', { n: i + 1 })}</Text>
                  {r.coins ? (
                    <Text style={styles.reward}>💰 {formatNumber(dailyCoins(game, r.coins))}</Text>
                  ) : null}
                  {r.gems ? <Text style={styles.reward}>💎 {r.gems}</Text> : null}
                  {r.relic ? <Text style={styles.reward}>🏺 {t('daily.relic')}</Text> : null}
                  {done ? <Text style={styles.check}>✓</Text> : null}
                </View>
              );
            })}
          </View>
          <Pressable
            style={[styles.btn, !can && { backgroundColor: colors.disabled }]}
            disabled={!can}
            onPress={() => useGame.getState().claimDaily()}
          >
            <Text style={styles.btnText}>{can ? t('daily.claim') : t('daily.claimed')}</Text>
          </Pressable>
          <Pressable style={styles.close} onPress={close}>
            <Text style={styles.closeText}>{t('room.close')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  card: {
    width: '100%',
    backgroundColor: colors.parchment,
    borderRadius: radius.lg,
    borderWidth: 4,
    borderColor: colors.goldDark,
    padding: space.lg,
    gap: space.md,
  },
  title: { fontSize: 22, fontWeight: '900', color: colors.ink, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  day: {
    width: '22%',
    minHeight: 78,
    backgroundColor: colors.parchmentDark,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  done: { opacity: 0.55 },
  current: { borderColor: colors.gold, backgroundColor: '#FFF3C4' },
  dayLabel: { fontSize: 11, fontWeight: '800', color: colors.inkSoft },
  reward: { fontSize: 12, fontWeight: '700', color: colors.ink },
  check: { position: 'absolute', top: 2, right: 6, color: colors.good, fontWeight: '900' },
  btn: {
    minHeight: TOUCH,
    backgroundColor: colors.good,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: colors.white, fontWeight: '900', fontSize: 16 },
  close: { alignItems: 'center', minHeight: 40, justifyContent: 'center' },
  closeText: { color: colors.inkSoft, fontWeight: '700' },
});
