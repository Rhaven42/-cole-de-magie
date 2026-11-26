import { useEffect, useState } from 'react';
import { Animated, Easing, Image, View } from 'react-native';
import { SPRITES } from '../assets';
import { HOUSE_IDS } from '../data/houses';
import { Crest } from './Crest';

/** Le Chaporacle, chapeau de répartition (sprite SpriteCook). Il se dandine quand il parle. */
export function Hat({ size = 56, talking = false }: { size?: number; talking?: boolean }) {
  const d = SPRITES.hat;
  return (
    <Image
      source={d.src}
      style={{
        width: size,
        height: (size * d.h) / d.w,
        transform: talking ? [{ rotate: '-6deg' }] : undefined,
      }}
      resizeMode="contain"
    />
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
