import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SCHEMA_VERSION } from '../engine';
import { t } from '../i18n';
import { Chip, Title } from '../ui/kit';
import { colors, radius, space, TOUCH } from '../ui/theme';
import { useGame } from '../state/store';

export function SettingsScreen() {
  const speed = useGame((s) => s.speed);
  const haptics = useGame((s) => s.haptics);
  const store = useGame.getState();
  const [confirm, setConfirm] = useState(false);
  return (
    <ScrollView style={styles.bg} contentContainerStyle={{ padding: space.lg, gap: space.md }}>
      <Title>{t('tab.settings')}</Title>
      <View style={styles.row}>
        <Text style={styles.label}>{t('settings.haptics')}</Text>
        <Switch value={haptics} onValueChange={store.setHaptics} />
      </View>
      <Text style={styles.label}>{t('settings.speed')}</Text>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        {[1, 2, 5, 10].map((n) => (
          <Chip key={n} label={`×${n}`} active={speed === n} onPress={() => store.setSpeed(n)} />
        ))}
      </View>
      {confirm ? (
        <View style={styles.confirm}>
          <Text style={styles.label}>{t('settings.resetConfirm')}</Text>
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
            <Pressable
              style={[styles.btn, { backgroundColor: colors.bad }]}
              onPress={() => {
                store.reset();
                setConfirm(false);
              }}
            >
              <Text style={styles.btnText}>{t('settings.yes')}</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={() => setConfirm(false)}>
              <Text style={styles.btnText}>{t('settings.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          style={[styles.btn, { backgroundColor: colors.bad }]}
          onPress={() => setConfirm(true)}
        >
          <Text style={styles.btnText}>{t('settings.reset')}</Text>
        </Pressable>
      )}
      <Text style={styles.version}>{t('settings.version', { v: '0.10.0', s: SCHEMA_VERSION })}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.parchmentDark },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: TOUCH,
  },
  label: { fontSize: 15, fontWeight: '600', color: colors.ink },
  btn: {
    minHeight: TOUCH,
    borderRadius: radius.md,
    backgroundColor: colors.woodLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  btnText: { color: colors.white, fontWeight: '700' },
  confirm: { backgroundColor: colors.parchment, padding: space.md, borderRadius: radius.md },
  version: { color: colors.inkSoft, marginTop: space.xl },
});
