import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { HOUSES } from '../data/houses';
import type { Student } from '../engine';
import { Chibi } from './Chibi';

const SIZE = 20;
/** Vitesse de marche (px de carte par seconde). */
const SPEED = 90;

/**
 * Élève sur la carte : se déplace en ligne droite (animation native) vers sa
 * position cible. Purement visuel : la simulation ne dépend pas de la marche.
 */
export function Walker({
  student,
  x,
  y,
  sleeping,
}: {
  student: Student;
  x: number;
  y: number;
  sleeping: boolean;
}) {
  const [pos] = useState(() => new Animated.ValueXY({ x, y }));
  const [bob] = useState(() => new Animated.Value(0));
  const last = useRef({ x, y });

  useEffect(() => {
    const dist = Math.hypot(x - last.current.x, y - last.current.y);
    if (dist < 0.5) return;
    last.current = { x, y };
    const step = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -2.5, duration: 140, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 140, useNativeDriver: true }),
      ]),
    );
    const move = Animated.timing(pos, {
      toValue: { x, y },
      duration: Math.min(4000, Math.max(150, (dist / SPEED) * 1000)),
      easing: Easing.linear,
      useNativeDriver: true,
    });
    step.start();
    move.start(() => {
      step.stop();
      bob.setValue(0);
    });
    return () => {
      move.stop();
      step.stop();
    };
  }, [x, y, pos, bob]);

  const hat = student.house ? HOUSES[student.house].color : '#4B3B5E';
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { transform: [{ translateX: pos.x }, { translateY: pos.y }] }]}
    >
      <Animated.View style={{ transform: [{ translateY: bob }] }}>
        <View style={styles.shadow} />
        <Chibi student={student} size={SIZE} sleeping={sleeping} />
        {!sleeping ? <View style={[styles.hat, { borderBottomColor: hat }]} /> : null}
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
  hat: {
    position: 'absolute',
    top: -7,
    left: SIZE / 2 - 6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
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
