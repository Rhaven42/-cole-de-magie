import { useEffect, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { SPRITES } from '../assets';
import { treeWait, type GameState } from '../engine';
import { useGame } from '../state/store';
import { iso, treePoint } from './iso';
import { TREE_W } from './MapArt';
import { formatDuration } from './theme';

/** Position écran (carte) de l'Arbre enchanté, pour le toucher. */
export function treeScreenPos() {
  const t = treePoint();
  return iso(t.x, t.y);
}

/**
 * Arbre enchanté de la cour : fruits dorés et bulle qui sautille quand c'est mûr,
 * sinon petit minuteur. L'arbre nu est dessiné dans la carte.
 */
export function MagicTree({ game }: { game: GameState }) {
  const p = treeScreenPos();
  const clock = useGame((s) => s.clock);
  const wait = treeWait(game, clock);
  const [bob] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [bob]);
  const d = SPRITES.magicTree;
  const h = (TREE_W * d.h) / d.w;
  const ready = wait <= 0;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {ready ? (
        <Image
          source={d.src}
          style={{
            position: 'absolute',
            left: p.x - TREE_W / 2,
            top: p.y - h,
            width: TREE_W,
            height: h,
          }}
        />
      ) : null}
      {ready ? (
        <Animated.View
          style={[
            styles.bubble,
            {
              left: p.x - 22,
              top: p.y - h - 38,
              transform: [
                { translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) },
              ],
            },
          ]}
        >
          <Image source={SPRITES.magicFruit.src} style={{ width: 26, height: 29 }} />
          <Text style={styles.bang}>!</Text>
        </Animated.View>
      ) : (
        <View style={[styles.timer, { left: p.x - 34, top: p.y - h + 2 }]}>
          <Text style={styles.timerText}>🍏 {formatDuration(wait)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF6DA',
    borderWidth: 3,
    borderColor: '#E0A526',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bang: {
    position: 'absolute',
    top: -8,
    right: -6,
    color: '#fff',
    backgroundColor: '#D9412B',
    borderRadius: 9,
    width: 18,
    height: 18,
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 12,
    overflow: 'hidden',
  },
  timer: {
    position: 'absolute',
    width: 68,
    backgroundColor: 'rgba(30,20,40,0.75)',
    borderRadius: 8,
    paddingVertical: 2,
  },
  timerText: { color: '#E9DDFF', fontSize: 10, fontWeight: '800', textAlign: 'center' },
});
