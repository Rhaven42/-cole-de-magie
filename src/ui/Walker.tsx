import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import type { Student } from '../engine';
import { Chibi } from './Chibi';
import { iso, route, type Anchor } from './iso';

const SIZE = 42;
/** Vitesse de marche (px de carte par seconde). */
const SPEED = 110;

function same(a: Anchor, b: Anchor): boolean {
  return a.room === b.room && Math.abs(a.g.x - b.g.x) < 0.01 && Math.abs(a.g.y - b.g.y) < 0.01;
}

/**
 * Élève sur la carte. Il suit les couloirs et passe par les portes
 * (chemin calculé par `route`), segment par segment. Purement visuel.
 */
export function Walker({
  student,
  anchor,
  sleeping,
  from,
  back = false,
  flip = false,
}: {
  student: Student;
  anchor: Anchor;
  sleeping: boolean;
  from?: Anchor;
  back?: boolean;
  flip?: boolean;
}) {
  const [init] = useState<Anchor>(() => from ?? anchor);
  const [start] = useState(() => iso(init.g.x, init.g.y));
  const [pos] = useState(() => new Animated.ValueXY(start));
  /** Cycle de pas : -1 → 0 → 1 (balancement + petit rebond à chaque pas). */
  const [stride] = useState(() => new Animated.Value(0));
  /** Orientation pendant la marche : miroir horizontal et face/dos (sans re-rendu). */
  const [flipV] = useState(() => new Animated.Value(flip ? -1 : 1));
  const [showBack] = useState(() => new Animated.Value(back ? 1 : 0));
  const last = useRef<Anchor>(init);
  const here = useRef(start);
  const key = `${anchor.room}|${anchor.g.x.toFixed(2)}|${anchor.g.y.toFixed(2)}`;

  useEffect(() => {
    showBack.setValue(back ? 1 : 0);
    flipV.setValue(flip ? -1 : 1);
  }, [back, flip, showBack, flipV]);

  useEffect(() => {
    const target: Anchor = { g: { ...anchor.g }, room: anchor.room };
    if (same(last.current, target)) return;
    const pts = route(last.current, target).map((p) => iso(p.x, p.y));
    last.current = target;
    let cancelled = false;
    let current: Animated.CompositeAnimation | null = null;
    const half = (to: number) =>
      Animated.timing(stride, {
        toValue: to,
        duration: 150,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });
    const step = Animated.loop(Animated.sequence([half(1), half(0), half(-1), half(0)]));
    step.start();
    const go = (i: number) => {
      if (cancelled) return;
      if (i >= pts.length) {
        step.stop();
        stride.setValue(0);
        flipV.setValue(flip ? -1 : 1);
        showBack.setValue(back ? 1 : 0);
        return;
      }
      const p = pts[i];
      const dx = p.x - here.current.x;
      const dy = p.y - here.current.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0.5) {
        // Sprites de face : regardent en bas à gauche ; de dos : en haut à droite.
        const up = dy < 0;
        showBack.setValue(up ? 1 : 0);
        flipV.setValue(up ? (dx < 0 ? -1 : 1) : dx > 0 ? -1 : 1);
      }
      current = Animated.timing(pos, {
        toValue: p,
        duration: Math.max(30, (dist / SPEED) * 1000),
        easing: Easing.linear,
        useNativeDriver: true,
      });
      current.start(({ finished }) => {
        if (!finished) return;
        here.current = p;
        go(i + 1);
      });
    };
    go(0);
    return () => {
      cancelled = true;
      current?.stop();
      step.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const bob = stride.interpolate({ inputRange: [-1, 0, 1], outputRange: [-2.5, 0, -2.5] });
  const sway = stride.interpolate({ inputRange: [-1, 1], outputRange: ['-4deg', '4deg'] });
  const showFront = showBack.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { transform: [{ translateX: pos.x }, { translateY: pos.y }] }]}
    >
      <View style={styles.shadow} />
      <Animated.View
        style={{ transform: [{ translateY: bob }, { rotate: sway }, { scaleX: flipV }] }}
      >
        <Animated.View style={{ opacity: showFront }}>
          <Chibi student={student} size={SIZE} sleeping={sleeping} />
        </Animated.View>
        {sleeping ? null : (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: showBack }]}>
            <Chibi student={student} size={SIZE} back />
          </Animated.View>
        )}
      </Animated.View>
      {sleeping ? <Text style={styles.zzz}>z</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: -SIZE / 2, top: -SIZE, width: SIZE, height: SIZE },
  shadow: {
    position: 'absolute',
    bottom: -2,
    left: 3,
    width: SIZE - 6,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  zzz: {
    position: 'absolute',
    top: -10,
    right: -6,
    color: '#CFE3FF',
    fontWeight: '900',
    fontStyle: 'italic',
    fontSize: 11,
  },
});
