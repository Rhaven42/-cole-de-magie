import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { PORTRAITS } from '../assets/portraits';
import { COURSE_IDS, COURSES, type CourseId } from '../data/courses';
import { HALL_PROF_X, PLOTS, PROF_SEAT_GAP, PROF_TABLE_Y, ROOM_SCALE } from '../data/layout';
import { PROF_LINES } from '../data/professors';
import { iso, roomOrigin, route, type Pt } from './iso';

/** Hauteur du personnage à l’écran (px de carte) ; les élèves font 42 px. */
const HEIGHT = 54;
const R = ROOM_SCALE;
/** Vitesse de marche (px de carte par seconde). */
const SPEED = 95;

/**
 * Professeur·e de la salle.
 * - Au repos : debout près du tableau, respire doucement.
 * - En cours : fait les cent pas, lance des étincelles et parle parfois aux élèves.
 * - Pause repas : traverse les couloirs jusqu'à la table des profs de la cantine, puis revient.
 */
export function Professor({
  stationId,
  courseId,
  teaching,
  eating,
  seat = 0,
}: {
  stationId: string;
  courseId: CourseId;
  teaching: boolean;
  eating: boolean;
  /** Place à la table des profs (ordre des salles construites). */
  seat?: number;
}) {
  const src = PORTRAITS[courseId];
  const o = roomOrigin(PLOTS[stationId]);
  const homeG: Pt = { x: o.x + 1.05 * R, y: o.y + 2.85 * R };
  const a = iso(homeG.x, homeG.y);
  const b = iso(o.x + 1.15 * R, o.y + 3.45 * R);
  const [pos] = useState(() => new Animated.ValueXY(a));
  const [breath] = useState(() => new Animated.Value(0));
  const [spark] = useState(() => new Animated.Value(0));
  /** Pas de marche (-1 → 1), sens du regard (1 = gauche, -1 = droite), assis à table. */
  const [stride] = useState(() => new Animated.Value(0));
  const [face] = useState(() => new Animated.Value(-1));
  const [seated] = useState(() => new Animated.Value(0));
  const [line, setLine] = useState<string | null>(null);
  const atHall = useRef(false);

  // Respiration (toujours).
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
    return () => idle.stop();
  }, [breath]);

  // Déplacements : cent pas en cours, aller-retour à la cantine pendant la pause.
  useEffect(() => {
    const hall = PLOTS.hall ? roomOrigin(PLOTS.hall) : null;
    const tableG: Pt | null = hall
      ? {
          x: hall.x + HALL_PROF_X - 1.1,
          y: hall.y + PROF_TABLE_Y + 0.3 + PROF_SEAT_GAP * (seat + 0.5),
        }
      : null;
    let anim: Animated.CompositeAnimation | null = null;
    let cancelled = false;
    const half = (to: number) =>
      Animated.timing(stride, {
        toValue: to,
        duration: 210,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });
    const steps = Animated.loop(Animated.sequence([half(1), half(0), half(-1), half(0)]));
    /** Marche segment par segment : se tourne dans le sens de la marche, pas réguliers. */
    const walkPath = (pts: Pt[], from: Pt, done?: () => void) => {
      seated.setValue(0);
      steps.start();
      let prev = iso(from.x, from.y);
      const go = (i: number) => {
        if (cancelled) return;
        if (i >= pts.length) {
          steps.stop();
          stride.setValue(0);
          done?.();
          return;
        }
        const q = iso(pts[i].x, pts[i].y);
        const dx = q.x - prev.x;
        const d = Math.hypot(dx, q.y - prev.y);
        if (Math.abs(dx) > 0.5) face.setValue(dx > 0 ? -1 : 1);
        prev = q;
        anim = Animated.timing(pos, {
          toValue: q,
          duration: Math.max(40, (d / SPEED) * 1000),
          easing: Easing.linear,
          useNativeDriver: true,
        });
        anim.start(({ finished }) => finished && go(i + 1));
      };
      go(0);
    };
    const stopAll = () => {
      cancelled = true;
      anim?.stop();
      steps.stop();
    };
    if (eating && tableG) {
      if (!atHall.current) {
        atHall.current = true;
        walkPath(route({ g: homeG, room: stationId }, { g: tableG, room: 'hall' }), homeG, () => {
          // Assis à la table des profs, tourné vers la salle.
          face.setValue(-1);
          seated.setValue(1);
        });
      }
      return stopAll;
    }
    if (atHall.current && tableG) {
      atHall.current = false;
      walkPath(route({ g: tableG, room: 'hall' }, { g: homeG, room: stationId }), tableG, () =>
        face.setValue(-1),
      );
      return stopAll;
    }
    seated.setValue(0);
    if (!teaching) {
      pos.setValue(a);
      face.setValue(-1);
      spark.setValue(0);
      return stopAll;
    }
    // En cours : fait les cent pas devant le tableau, en se retournant à chaque bout.
    const walk = (to: { x: number; y: number }, dir: number) =>
      Animated.sequence([
        Animated.timing(face, { toValue: dir, duration: 0, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(pos, {
            toValue: to,
            duration: 2200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.sequence([half(1), half(0), half(-1), half(0), half(1), half(0)]),
        ]),
      ]);
    const pace = Animated.loop(
      Animated.sequence([
        walk(b, b.x > a.x ? -1 : 1),
        Animated.delay(1600),
        walk(a, a.x > b.x ? -1 : 1),
        Animated.timing(face, { toValue: -1, duration: 0, useNativeDriver: true }),
        Animated.delay(1600),
      ]),
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
      stopAll();
      pace.stop();
      sparkle.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teaching, eating, stationId]);

  // De temps en temps, une petite phrase aux élèves (pendant le cours).
  useEffect(() => {
    if (!teaching || eating) return undefined;
    const lines = PROF_LINES[courseId];
    const seed = COURSE_IDS.indexOf(courseId);
    let hide: ReturnType<typeof setTimeout> | null = null;
    const timer = setInterval(
      () => {
        if (Math.random() < 0.45) {
          setLine(lines[Math.floor(Math.random() * lines.length)]);
          hide = setTimeout(() => setLine(null), 3500);
        }
      },
      9000 + seed * 700,
    );
    return () => {
      clearInterval(timer);
      if (hide) clearTimeout(hide);
      setLine(null);
    };
  }, [teaching, eating, courseId]);

  if (!src) return null;
  // Portraits ≈ 1:2 ; « contain » garde les proportions exactes.
  const w = Math.round(HEIGHT * 0.6);
  const scaleY = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] });
  const bob = stride.interpolate({ inputRange: [-1, 0, 1], outputRange: [-2.5, 0, -2.5] });
  const sway = stride.interpolate({ inputRange: [-1, 1], outputRange: ['-2deg', '2deg'] });
  // Assis : il descend un peu, et la table cache le bas de son corps.
  const sitDrop = seated.interpolate({ inputRange: [0, 1], outputRange: [0, HEIGHT * 0.22] });
  const standO = seated.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        { left: -w / 2, top: -HEIGHT + 4, width: w, height: HEIGHT },
        { transform: [{ translateX: pos.x }, { translateY: pos.y }] },
      ]}
    >
      <Animated.View style={[styles.shadow, { width: w * 0.7, left: w * 0.15, opacity: standO }]} />
      {/* Debout (marche, cours) */}
      <Animated.View
        style={{
          position: 'absolute',
          width: w,
          height: HEIGHT,
          opacity: standO,
          transform: [
            { translateY: bob },
            { rotate: sway },
            { translateY: HEIGHT / 2 },
            { scaleY },
            { translateY: -HEIGHT / 2 },
            { scaleX: face },
          ],
        }}
      >
        {/* Les portraits regardent vers la gauche : miroir (face = -1) pour regarder à droite. */}
        <Image source={src} style={{ width: w, height: HEIGHT }} resizeMode="contain" />
      </Animated.View>
      {/* Assis à la table des profs : seul le haut du corps dépasse de la table. */}
      <Animated.View
        style={{
          position: 'absolute',
          width: w,
          height: HEIGHT * 0.6,
          overflow: 'hidden',
          opacity: seated,
          transform: [{ translateY: sitDrop }],
        }}
      >
        <Image
          source={src}
          style={{ width: w, height: HEIGHT, transform: [{ scaleX: -1 }] }}
          resizeMode="contain"
        />
      </Animated.View>
      {teaching && !eating ? (
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
      {eating ? <Text style={styles.meal}>🍗</Text> : null}
      {line ? (
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{line}</Text>
          <View style={styles.bubbleTail} />
        </View>
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
  meal: { position: 'absolute', top: -6, right: -10, fontSize: 12 },
  bubble: {
    position: 'absolute',
    bottom: HEIGHT + 2,
    left: -44,
    width: 120,
    backgroundColor: '#FFF8E6',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#5A3A22',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  bubbleText: { fontSize: 9, fontWeight: '700', color: '#3B2414', textAlign: 'center' },
  bubbleTail: {
    position: 'absolute',
    bottom: -6,
    left: 54,
    width: 10,
    height: 10,
    backgroundColor: '#FFF8E6',
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#5A3A22',
    transform: [{ rotate: '45deg' }],
  },
});
