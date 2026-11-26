import { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

/** Texte flottant « +12 💰 » qui monte et s'efface. */
export function FloatText({
  text,
  color,
  offset,
}: {
  text: string;
  color: string;
  offset: number;
}) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 1100, useNativeDriver: true }).start();
  }, [v]);
  return (
    <Animated.Text
      pointerEvents="none"
      style={[
        styles.float,
        {
          color,
          left: `${15 + offset * 55}%`,
          opacity: v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
          transform: [
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -40] }) },
            { scale: v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.6, 1.15, 1] }) },
          ],
        },
      ]}
    >
      {text}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  float: {
    position: 'absolute',
    top: '40%',
    fontWeight: '900',
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
