/**
 * Vie de l'école : animations d'ambiance purement visuelles (natives, en boucle).
 * Nuages qui passent, hiboux qui volent, chat qui fait sa ronde dans les couloirs,
 * vapeur des chaudrons, feu de cheminée, fontaine, et lumières la nuit.
 */
import { useEffect, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { SPRITES } from '../assets';
import { ROOM_SCALE } from '../data/layout';
import type { GameState } from '../engine';
import {
  CORRIDOR_X,
  CORRIDOR_Y,
  fountainPoint,
  iso,
  MAP_H,
  MAP_W,
  seatPos,
  stationOrigin,
  type Pt,
} from './iso';

function useLoop(duration: number, delay = 0, easing = Easing.linear) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration, easing, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [v, duration, delay, easing]);
  return v;
}

/** Ombre de nuage qui traverse lentement la carte. */
function Cloud({
  y,
  duration,
  delay,
  scale,
}: {
  y: number;
  duration: number;
  delay: number;
  scale: number;
}) {
  const v = useLoop(duration, delay);
  const x = v.interpolate({ inputRange: [0, 1], outputRange: [-500, MAP_W + 200] });
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.cloud, { top: y, transform: [{ translateX: x }, { scale }] }]}
    >
      <View style={[styles.puff, { left: 0, top: 30, width: 220, height: 90 }]} />
      <View style={[styles.puff, { left: 120, top: 0, width: 240, height: 120 }]} />
      <View style={[styles.puff, { left: 280, top: 40, width: 200, height: 80 }]} />
    </Animated.View>
  );
}

/** Hibou qui traverse le ciel de l'école en battant des ailes (léger balancement). */
function Owl({ y, duration, delay }: { y: number; duration: number; delay: number }) {
  const v = useLoop(duration, delay);
  const bob = useLoop(700, 0, Easing.inOut(Easing.sin));
  const x = v.interpolate({ inputRange: [0, 1], outputRange: [MAP_W + 60, -120] });
  const dy = bob.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -10, 0] });
  const d = SPRITES.owlFly;
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', top: y, transform: [{ translateX: x }, { translateY: dy }] }}
    >
      <Image
        source={d.src}
        style={{ width: 26, height: (26 * d.h) / d.w, transform: [{ rotate: '-12deg' }] }}
      />
    </Animated.View>
  );
}

/** Le chat de l'école fait sa ronde le long des couloirs. */
function Cat() {
  const [pos] = useState(() => {
    const p = iso(CORRIDOR_X[1], CORRIDOR_Y[1]);
    return new Animated.ValueXY(p);
  });
  useEffect(() => {
    const loop: Pt[] = [
      { x: CORRIDOR_X[1], y: CORRIDOR_Y[1] },
      { x: CORRIDOR_X[4], y: CORRIDOR_Y[1] },
      { x: CORRIDOR_X[4], y: CORRIDOR_Y[3] },
      { x: CORRIDOR_X[2], y: CORRIDOR_Y[3] },
      { x: CORRIDOR_X[2], y: CORRIDOR_Y[2] },
      { x: CORRIDOR_X[1], y: CORRIDOR_Y[2] },
    ].map((g) => iso(g.x, g.y));
    const steps = loop.map((p, i) => {
      const prev = loop[(i + loop.length - 1) % loop.length];
      const dist = Math.hypot(p.x - prev.x, p.y - prev.y);
      return Animated.sequence([
        Animated.timing(pos, {
          toValue: p,
          duration: (dist / 28) * 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.delay(i % 2 ? 2500 : 600),
      ]);
    });
    const anim = Animated.loop(Animated.sequence(steps));
    anim.start();
    return () => anim.stop();
  }, [pos]);
  const d = SPRITES.cat;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: -9,
        top: -20,
        transform: [{ translateX: pos.x }, { translateY: pos.y }],
      }}
    >
      <Image source={d.src} style={{ width: 18, height: (18 * d.h) / d.w }} />
    </Animated.View>
  );
}

/** Bouffée de vapeur au-dessus d'un chaudron. */
function Steam({ p, delay }: { p: Pt; delay: number }) {
  const v = useLoop(2200, delay, Easing.out(Easing.quad));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.steam,
        {
          left: p.x - 5,
          top: p.y - 30,
          opacity: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.55, 0] }),
          transform: [
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -26] }) },
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.6] }) },
          ],
        },
      ]}
    />
  );
}

/** Lueur qui vacille (cheminée, bougies). */
function Flicker({ p, size, color }: { p: Pt; size: number; color: string }) {
  const v = useLoop(900, 0, Easing.inOut(Easing.sin));
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: p.x - size / 2,
        top: p.y - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.18, 0.34, 0.18] }),
      }}
    />
  );
}

/** Reflets sur l'eau de la fontaine. */
function Sparkle({ p, delay }: { p: Pt; delay: number }) {
  const v = useLoop(1600, delay);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.sparkle,
        {
          left: p.x - 2,
          top: p.y - 2,
          opacity: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.9, 0] }),
        },
      ]}
    />
  );
}

export function Ambient({ game }: { game: GameState }) {
  const potions = game.stations['course-potions'];
  const po = stationOrigin('course-potions');
  const hall = stationOrigin('hall');
  const fp = fountainPoint();
  const gc = iso(fp.x, fp.y);
  return (
    <>
      {potions && po
        ? potions.seats.slice(0, 6).map((seat, i) => {
            const sp = seatPos('course', i, seat.pos);
            return <Steam key={`st${i}`} p={iso(po.x + sp.x, po.y + sp.y)} delay={i * 450} />;
          })
        : null}
      {hall ? (
        <Flicker
          p={{
            x: iso(hall.x + 0.6 * ROOM_SCALE, hall.y + 4.3 * ROOM_SCALE).x,
            y: iso(hall.x + 0.6 * ROOM_SCALE, hall.y + 4.3 * ROOM_SCALE).y - 14,
          }}
          size={70}
          color="#FF9A3C"
        />
      ) : null}
      {gc
        ? [0, 1, 2, 3].map((i) => (
            <Sparkle
              key={`sp${i}`}
              p={{ x: gc.x - 14 + i * 9, y: gc.y - 3 + (i % 2) * 4 }}
              delay={i * 400}
            />
          ))
        : null}
      <Cat />
      <Owl y={MAP_H * 0.25} duration={16000} delay={4000} />
      <Owl y={MAP_H * 0.55} duration={20000} delay={14000} />
      <Cloud y={MAP_H * 0.1} duration={90000} delay={0} scale={1.4} />
      <Cloud y={MAP_H * 0.45} duration={120000} delay={30000} scale={1.8} />
      <Cloud y={MAP_H * 0.7} duration={100000} delay={60000} scale={1.2} />
    </>
  );
}

const styles = StyleSheet.create({
  cloud: { position: 'absolute', left: 0, width: 480, height: 160 },
  puff: { position: 'absolute', borderRadius: 200, backgroundColor: '#0B1A10', opacity: 0.07 },
  steam: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E8F6E0',
  },
  sparkle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  lampGlowOuter: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFC867',
    opacity: 0.22,
  },
  lampGlowInner: {
    position: 'absolute',
    left: 9,
    top: 9,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFE2A0',
    opacity: 0.45,
  },
});
