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
}: {
  student: Student;
  anchor: Anchor;
  sleeping: boolean;
  from?: Anchor;
  back?: boolean;
}) {
  const [init] = useState<Anchor>(() => from ?? anchor);
  const [start] = useState(() => iso(init.g.x, init.g.y));
  const [pos] = useState(() => new Animated.ValueXY(start));
  const [bob] = useState(() => new Animated.Value(0));
  const last = useRef<Anchor>(init);
  const here = useRef(start);
  const key = `${anchor.room}|${anchor.g.x.toFixed(2)}|${anchor.g.y.toFixed(2)}`;

  useEffect(() => {
    const target: Anchor = { g: { ...anchor.g }, room: anchor.room };
    if (same(last.current, target)) return;
    const pts = route(last.current, target).map((p) => iso(p.x, p.y));
    last.current = target;
    let cancelled = false;
    let current: Animated.CompositeAnimation | null = null;
    const step = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -2.5, duration: 140, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 140, useNativeDriver: true }),
      ]),
    );
    step.start();
    const go = (i: number) => {
      if (cancelled) return;
      if (i >= pts.length) {
        step.stop();
        bob.setValue(0);
        return;
      }
      const p = pts[i];
      const dist = Math.hypot(p.x - here.current.x, p.y - here.current.y);
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

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { transform: [{ translateX: pos.x }, { translateY: pos.y }] }]}
    >
      <Animated.View style={{ transform: [{ translateY: bob }] }}>
        <View style={styles.shadow} />
        <Chibi student={student} size={SIZE} sleeping={sleeping} back={back} />
        {sleeping ? <Text style={styles.zzz}>z</Text> : null}
      </Animated.View>
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
