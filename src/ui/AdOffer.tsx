import { useEffect, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AD_LABEL, ADS } from '../data/ads';
import { adCoins, adOffer, boostActive } from '../engine';
import { ADS_SIMULATED, showRewardedAd } from '../services/ads';
import { useGame } from '../state/store';
import { colors, formatDuration, formatNumber, radius, space } from './theme';

/** Bulle « Bonus ! » qui apparaît de temps en temps, et minuteur du ×2. */
export function AdOffer() {
  const game = useGame((s) => s.game);
  const kind = adOffer(game);
  const [open, setOpen] = useState(false);
  const [watching, setWatching] = useState(0);
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  // Compte à rebours de la vidéo simulée.
  useEffect(() => {
    if (watching <= 0) return undefined;
    const t = setTimeout(() => {
      if (watching === 1) {
        showRewardedAd().then((ok) => {
          if (ok) useGame.getState().claimAd();
          setOpen(false);
        });
      }
      setWatching((w) => w - 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [watching]);

  const boost = boostActive(game);
  return (
    <>
      {boost ? (
        <View style={styles.boost} pointerEvents="none">
          <Text style={styles.boostText}>
            ⚡ ×2 · {formatDuration((game.boostUntil ?? 0) - game.time)}
          </Text>
        </View>
      ) : null}
      {kind ? (
        <Animated.View
          style={[
            styles.bubbleWrap,
            {
              transform: [
                { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
              ],
            },
          ]}
        >
          <Pressable style={styles.bubble} onPress={() => setOpen(true)} accessibilityRole="button">
            <Text style={styles.bubbleIcon}>🎁</Text>
            <Text style={styles.bubbleText}>Bonus !</Text>
          </Pressable>
        </Animated.View>
      ) : null}
      <Modal
        visible={open && !!kind}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          {watching > 0 ? (
            <View style={styles.video}>
              <Text style={styles.videoTitle}>Publicité{ADS_SIMULATED ? ' (simulée)' : ''}</Text>
              <Text style={styles.videoCount}>{watching}</Text>
              <Text style={styles.videoSub}>La récompense arrive à la fin de la vidéo…</Text>
            </View>
          ) : kind ? (
            <View style={styles.card}>
              <View style={styles.banner}>
                <Text style={styles.bannerText}>Récompense</Text>
              </View>
              <Text style={styles.icon}>{AD_LABEL[kind].icon}</Text>
              <Text style={styles.title}>{AD_LABEL[kind].title}</Text>
              {kind === 'coins' ? (
                <Text style={styles.amount}>+{formatNumber(adCoins(game))} 💰</Text>
              ) : null}
              <Text style={styles.sub}>Regarde une courte vidéo pour l’obtenir.</Text>
              <Pressable style={styles.watch} onPress={() => setWatching(ADS.videoSeconds)}>
                <Text style={styles.watchText}>▶ Regarder</Text>
              </Pressable>
              <Pressable
                style={styles.no}
                onPress={() => {
                  useGame.getState().dismissAd();
                  setOpen(false);
                }}
              >
                <Text style={styles.noText}>Non merci</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bubbleWrap: { position: 'absolute', left: space.md, top: 90 },
  bubble: {
    backgroundColor: '#FFF3D6',
    borderRadius: 30,
    borderWidth: 3,
    borderColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  bubbleIcon: { fontSize: 26 },
  bubbleText: { fontWeight: '900', color: '#8A5A2B', fontSize: 12 },
  boost: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: '#5FAE3A',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  boostText: { color: '#fff', fontWeight: '900' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 290,
    backgroundColor: '#F3E3BF',
    borderRadius: radius.lg,
    borderWidth: 4,
    borderColor: '#8A5A2B',
    alignItems: 'center',
    paddingBottom: space.md,
    overflow: 'hidden',
  },
  banner: {
    alignSelf: 'stretch',
    backgroundColor: '#8A5A2B',
    paddingVertical: space.sm,
    alignItems: 'center',
  },
  bannerText: { color: '#FFF3D6', fontWeight: '900', fontSize: 17 },
  icon: { fontSize: 54, marginTop: space.md },
  title: {
    fontWeight: '900',
    fontSize: 17,
    color: '#4A2E16',
    textAlign: 'center',
    marginHorizontal: space.md,
  },
  amount: { fontWeight: '900', fontSize: 20, color: '#C77A10', marginTop: 4 },
  sub: { color: '#7A6446', marginVertical: space.sm, textAlign: 'center' },
  watch: {
    backgroundColor: '#5FAE3A',
    borderRadius: radius.sm,
    borderBottomWidth: 3,
    borderColor: '#3D7A22',
    paddingHorizontal: 26,
    paddingVertical: 8,
  },
  watchText: { color: '#fff', fontWeight: '900', fontSize: 17 },
  no: { marginTop: space.sm, padding: space.sm },
  noText: { color: '#7A6446', fontWeight: '700' },
  video: {
    width: 300,
    height: 420,
    backgroundColor: '#111',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
  },
  videoTitle: { color: '#ddd', fontWeight: '800' },
  videoCount: { color: '#fff', fontWeight: '900', fontSize: 64 },
  videoSub: { color: '#aaa', textAlign: 'center', marginHorizontal: space.lg },
});
