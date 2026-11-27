import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '../i18n';
import { useGame } from '../state/store';
import { colors, formatDuration, formatNumber, radius, space, TOUCH } from './theme';

export function OfflineModal() {
  const summary = useGame((s) => s.offline);
  if (!summary) return null;
  const close = () => useGame.getState().dismissOffline();
  return (
    <Modal transparent animationType="fade" visible onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>🌙 {t('offline.title')}</Text>
          <Text style={styles.line}>
            {summary.capped
              ? `Gains cumulés pendant ${formatDuration(summary.seconds)} (plafond atteint).`
              : t('offline.duration', { time: formatDuration(summary.seconds) })}
          </Text>
          <Text style={[styles.line, styles.big]}>
            {t('offline.coins', { n: formatNumber(summary.coins) })}
          </Text>
          <Text style={styles.line}>📚 {t('offline.courses', { n: summary.courses })}</Text>
          <Text style={styles.line}>🎒 {t('offline.arrived', { n: summary.arrived })}</Text>
          {summary.left > 0 ? (
            <Text style={[styles.line, { color: colors.bad }]}>
              😤 {t('offline.left', { n: summary.left })}
            </Text>
          ) : null}
          {summary.cap ? (
            <Text style={styles.cap}>
              ⏳ Plafond hors-ligne : {formatDuration(summary.cap)} · allonge-le avec la Veilleuse
              du Gardien (boutique 💎)
            </Text>
          ) : null}
          <Pressable style={styles.btn} onPress={close}>
            <Text style={styles.btnText}>{t('offline.ok')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  cap: { color: colors.inkSoft, fontSize: 12, textAlign: 'center', marginTop: 6 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  card: {
    width: '100%',
    backgroundColor: colors.parchment,
    borderRadius: radius.lg,
    borderWidth: 4,
    borderColor: colors.goldDark,
    padding: space.xl,
    gap: space.sm,
  },
  title: { fontSize: 22, fontWeight: '900', color: colors.ink, textAlign: 'center' },
  line: { fontSize: 15, color: colors.ink, textAlign: 'center' },
  big: { fontSize: 20, fontWeight: '800', color: colors.goldDark },
  btn: {
    marginTop: space.md,
    minHeight: TOUCH,
    backgroundColor: colors.good,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: colors.white, fontWeight: '800', fontSize: 16 },
});
