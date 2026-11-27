/**
 * Deux fantômes de l'école qui se baladent de temps en temps dans les couloirs :
 * ils apparaissent en fondu, flottent d'un carrefour à un autre, puis s'évanouissent.
 * Purement visuel.
 */
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { SPRITES, type SpriteName } from '../assets';
import { CORRIDOR_X, CORRIDOR_Y, iso, route, type Pt } from './iso';

const HEIGHT = 50;
/** Vitesse de flottement (px de carte par seconde). */
const SPEED = 38;

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

/** Un carrefour de couloirs au hasard. */
function randomCrossing(): Pt {
  return { x: pick(CORRIDOR_X), y: pick(CORRIDOR_Y) };
}

function Ghost({ name, firstDelay }: { name: 'ghostMonk' | 'ghostLady'; firstDelay: number }) {
  const [pos] = useState(() => new Animated.ValueXY({ x: -999, y: -999 }));
  const [fade] = useState(() => new Animated.Value(0));
  const [bob] = useState(() => new Animated.Value(0));
  const [face] = useState(() => new Animated.Value(1));
  const [back] = useState(() => new Animated.Value(0));

  // Flottement continu (de haut en bas).
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  // Promenades espacées : 40 à 90 s entre deux apparitions.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let anim: Animated.CompositeAnimation | null = null;
    let stopped = false;
    const wander = () => {
      if (stopped) return;
      const a = randomCrossing();
      let b = randomCrossing();
      for (let i = 0; i < 5 && Math.hypot(a.x - b.x, a.y - b.y) < 12; i++) b = randomCrossing();
      const pts = route({ g: a, room: null }, { g: b, room: null }).map((p) => iso(p.x, p.y));
      let here = iso(a.x, a.y);
      pos.setValue(here);
      const steps: Animated.CompositeAnimation[] = [
        Animated.timing(fade, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ];
      for (const p of pts) {
        const dx = p.x - here.x;
        const dy = p.y - here.y;
        const d = Math.hypot(dx, dy);
        if (d < 1) continue;
        // Sprites de face : regardent en bas à gauche ; de dos : en haut à droite.
        const up = dy < 0;
        const flip = up ? (dx < 0 ? -1 : 1) : dx > 0 ? -1 : 1;
        steps.push(
          Animated.parallel([
            Animated.timing(back, { toValue: up ? 1 : 0, duration: 0, useNativeDriver: true }),
            Animated.timing(face, { toValue: flip, duration: 0, useNativeDriver: true }),
          ]),
          Animated.timing(pos, {
            toValue: p,
            duration: (d / SPEED) * 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        );
        here = p;
      }
      steps.push(Animated.timing(fade, { toValue: 0, duration: 1500, useNativeDriver: true }));
      anim = Animated.sequence(steps);
      anim.start(() => {
        if (!stopped) timer = setTimeout(wander, 40_000 + Math.random() * 50_000);
      });
    };
    timer = setTimeout(wander, firstDelay);
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      anim?.stop();
    };
  }, [firstDelay, pos, fade, face, back]);

  const front = SPRITES[name as SpriteName];
  const rear = SPRITES[`${name}-back` as SpriteName];
  const w = (HEIGHT * front.w) / front.h;
  const y = bob.interpolate({ inputRange: [0, 1], outputRange: [-14, -22] });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          left: -w / 2,
          top: -HEIGHT,
          width: w,
          height: HEIGHT,
          opacity: Animated.multiply(fade, 0.72),
          transform: [{ translateX: pos.x }, { translateY: pos.y }],
        },
      ]}
    >
      <View style={[styles.glow, { width: w * 0.8, left: w * 0.1 }]} />
      <Animated.View
        style={{ width: w, height: HEIGHT, transform: [{ translateY: y }, { scaleX: face }] }}
      >
        <Animated.Image
          source={front.src}
          style={[
            StyleSheet.absoluteFill,
            { opacity: back.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
          ]}
          resizeMode="contain"
        />
        <Animated.Image
          source={rear.src}
          style={[StyleSheet.absoluteFill, { opacity: back }]}
          resizeMode="contain"
        />
      </Animated.View>
    </Animated.View>
  );
}

/** Les deux fantômes de l'école. */
export function Ghosts() {
  return (
    <>
      <Ghost name="ghostMonk" firstDelay={15_000} />
      <Ghost name="ghostLady" firstDelay={45_000} />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute' },
  glow: {
    position: 'absolute',
    bottom: -2,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(170,210,255,0.35)',
  },
});
