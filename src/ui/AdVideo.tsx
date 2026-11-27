import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ADS } from '../data/ads';
import { ADS_SIMULATED, showRewardedAd } from '../services/ads';
import { radius, space } from './theme';

/** Vidéo récompensée (simulée : compte à rebours). Appelle `onDone(true)` à la fin. */
export function AdVideo({ onDone }: { onDone: (ok: boolean) => void }) {
  const [left, setLeft] = useState<number>(ADS.videoSeconds);
  useEffect(() => {
    if (left <= 0) {
      showRewardedAd().then(onDone);
      return undefined;
    }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);
  return (
    <View style={styles.video}>
      <Text style={styles.title}>Publicité{ADS_SIMULATED ? ' (simulée)' : ''}</Text>
      <Text style={styles.count}>{Math.max(left, 0)}</Text>
      <Text style={styles.sub}>La récompense arrive à la fin de la vidéo…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  video: {
    width: 300,
    height: 420,
    backgroundColor: '#111',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
  },
  title: { color: '#ddd', fontWeight: '800' },
  count: { color: '#fff', fontWeight: '900', fontSize: 64 },
  sub: { color: '#aaa', textAlign: 'center', marginHorizontal: space.lg },
});
