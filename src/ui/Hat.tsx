import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { HOUSE_IDS } from '../data/houses';
import { Crest } from './Crest';

/** Méliandre, le Chapeau Songeur : chapeau pointu rapiécé, yeux brodés, bouche cousue. */
export function Hat({ size = 56, talking = false }: { size?: number; talking?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Ellipse cx={50} cy={84} rx={44} ry={10} fill="#4A3020" />
      <Path
        d="M16 82 C30 70 36 50 46 30 C52 18 60 8 72 6 C66 14 64 22 66 30 C70 46 76 66 84 82 Z"
        fill="#7A5634"
      />
      <Path
        d="M58 40 L70 38 L72 50 L60 52 Z"
        fill="#9C7A4E"
        stroke="#3B2414"
        strokeWidth={1.5}
        strokeDasharray="3 2"
      />
      <Path
        d="M28 70 L38 68 L40 76 L30 78 Z"
        fill="#5E4A2E"
        stroke="#3B2414"
        strokeWidth={1.5}
        strokeDasharray="3 2"
      />
      <Path d="M36 58 Q42 52 48 58" stroke="#2E2118" strokeWidth={3} fill="none" />
      <Path d="M54 58 Q60 52 66 58" stroke="#2E2118" strokeWidth={3} fill="none" />
      <Circle cx={42} cy={60} r={2} fill="#F6E9CC" />
      <Circle cx={60} cy={60} r={2} fill="#F6E9CC" />
      {talking ? (
        <Ellipse cx={51} cy={72} rx={7} ry={4} fill="#2E2118" />
      ) : (
        <Path
          d="M42 72 L46 70 L50 73 L54 70 L58 73 L62 71"
          stroke="#2E2118"
          strokeWidth={2.5}
          fill="none"
        />
      )}
    </Svg>
  );
}

/** Bulle de pensée avec les 4 blasons qui tournent pendant la réflexion. */
export function ThinkingCrests({ size = 44 }: { size?: number }) {
  const [spin] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const c = size * 0.42;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'rgba(255,255,255,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Animated.View style={{ width: size, height: size, transform: [{ rotate }] }}>
        {HOUSE_IDS.map((h, i) => {
          const a = (i / 4) * Math.PI * 2;
          return (
            <View
              key={h}
              style={{
                position: 'absolute',
                left: size / 2 - c / 2 + Math.cos(a) * size * 0.26,
                top: size / 2 - c / 2 + Math.sin(a) * size * 0.26,
              }}
            >
              <Crest house={h} size={c} />
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
}
