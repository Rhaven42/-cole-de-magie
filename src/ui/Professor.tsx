import { useEffect, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { PORTRAITS } from '../assets/portraits';
import { COURSES, type CourseId } from '../data/courses';
import { PLOTS, ROOM_SCALE } from '../data/layout';
import { iso, roomOrigin } from './iso';

/** Hauteur du personnage à l'écran (px de carte) ; les élèves font 34 px. */
const HEIGHT = 50;
const R = ROOM_SCALE;

/**
 * Professeur·e debout entre le tableau et son bureau, face aux élèves.
 * Au repos : respire doucement. En cours (au moins un·e élève assis·e) :
 * fait les cent pas devant le tableau et lance de petites étincelles.
 */
export function Professor({
  stationId,
  courseId,
  teaching,
}: {
  stationId: string;
  courseId: CourseId;
  teaching: boolean;
}) {
  const src = PORTRAITS[courseId];
  const o = roomOrigin(PLOTS[stationId]);
  const a = iso(o.x + 1.05 * R, o.y + 2.85 * R);
  const b = iso(o.x + 1.15 * R, o.y + 3.45 * R);
  const [pos] = useState(() => new Animated.ValueXY(a));
  const [breath] = useState(() => new Animated.Value(0));
  const [spark] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const idle = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    idle.start();
    if (!teaching) {
      pos.setValue(a);
      spark.setValue(0);
      return () => idle.stop();
    }
    const walk = (to: { x: number; y: number }) =>
      Animated.timing(pos, {
        toValue: to,
        duration: 2200,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      });
    const pace = Animated.loop(
      Animated.sequence([walk(b), Animated.delay(1600), walk(a), Animated.delay(1600)]),
    );
    const sparkle = Animated.loop(
      Animated.sequence([
        Animated.timing(spark, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(spark, { toValue: 0, duration: 900, useNativeDriver: true }),
        Animated.delay(1500),
      ]),
    );
    pace.start();
    sparkle.start();
    return () => {
      idle.stop();
      pace.stop();
      sparkle.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teaching, stationId]);

  if (!src) return null;
  // Portraits ≈ 1:2 ; « contain » garde les proportions exactes.
  const w = Math.round(HEIGHT * 0.6);
  const scaleY = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        { left: -w / 2, top: -HEIGHT + 4, width: w, height: HEIGHT },
        { transform: [{ translateX: pos.x }, { translateY: pos.y }] },
      ]}
    >
      <View style={[styles.shadow, { width: w * 0.7, left: w * 0.15 }]} />
      <Animated.View
        style={{
          width: w,
          height: HEIGHT,
          transform: [{ translateY: HEIGHT / 2 }, { scaleY }, { translateY: -HEIGHT / 2 }],
        }}
      >
        {/* Les portraits regardent vers la gauche : miroir pour faire face aux élèves. */}
        <Image
          source={src}
          style={{ width: w, height: HEIGHT, transform: [{ scaleX: -1 }] }}
          resizeMode="contain"
        />
      </Animated.View>
      {teaching ? (
        <Animated.View
          style={[
            styles.spark,
            {
              left: w - 4,
              opacity: spark,
              transform: [
                { translateY: spark.interpolate({ inputRange: [0, 1], outputRange: [4, -6] }) },
              ],
            },
          ]}
        >
          <Text style={styles.sparkText}>{COURSES[courseId].icon}</Text>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute' },
  shadow: {
    position: 'absolute',
    bottom: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  spark: { position: 'absolute', top: 8 },
  sparkText: { fontSize: 11 },
});
