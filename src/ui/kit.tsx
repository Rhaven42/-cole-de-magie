import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { t } from '../i18n';
import type { Station } from '../engine';
import { colors, fonts, formatNumber, radius, space, TOUCH } from './theme';

export function stationName(st: Station): string {
  if (st.kind === 'course') return t(`course.${st.courseId}`);
  if (st.kind === 'dorm') return t('service.dorm', { n: (st.index ?? 0) + 1 });
  return t(`service.${st.kind}`);
}

export function Title({ children, style }: { children: ReactNode; style?: object }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function Body({ children, style }: { children: ReactNode; style?: object }) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

interface BuyProps {
  label: string;
  cost: number | null;
  coins: number;
  onPress: () => void;
  sub?: string;
  icon?: string;
  style?: StyleProp<ViewStyle>;
}

/** Bouton d'achat : prix en Éclats, grisé si trop cher, « Maximum » si plafonné. */
export function BuyButton({ label, cost, coins, onPress, sub, icon, style }: BuyProps) {
  const maxed = cost === null;
  const affordable = !maxed && coins >= cost;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !affordable }}
      onPress={affordable ? onPress : undefined}
      style={({ pressed }) => [
        styles.buy,
        !affordable && styles.buyDisabled,
        pressed && affordable && styles.pressed,
        style,
      ]}
    >
      {icon ? <Text style={styles.buyIcon}>{icon}</Text> : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.buyLabel} numberOfLines={2}>
          {label}
        </Text>
        {sub ? <Text style={styles.buySub}>{sub}</Text> : null}
      </View>
      <View style={[styles.price, !affordable && { backgroundColor: colors.disabled }]}>
        <Text style={styles.priceText}>{maxed ? t('room.maxed') : `${formatNumber(cost)} 💰`}</Text>
      </View>
    </Pressable>
  );
}

export function Bar({
  value,
  color = colors.gold,
  height = 6,
}: {
  value: number;
  color?: string;
  height?: number;
}) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <View style={[styles.barBg, { height, borderRadius: height / 2 }]}>
      <View
        style={{ width: `${v * 100}%`, height, borderRadius: height / 2, backgroundColor: color }}
      />
    </View>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
  color,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active && { backgroundColor: color ?? colors.gold, borderColor: colors.woodDark },
      ]}
    >
      <Text style={[styles.chipText, active && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  title: { fontFamily: fonts.title, fontSize: 20, fontWeight: '700', color: colors.ink },
  body: { fontSize: 14, color: colors.ink },
  buy: {
    minHeight: TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.parchment,
    borderColor: colors.woodLight,
    borderWidth: 2,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginVertical: space.xs,
    gap: space.sm,
  },
  buyDisabled: { opacity: 0.6 },
  pressed: { transform: [{ scale: 0.97 }] },
  buyIcon: { fontSize: 22 },
  buyLabel: { fontSize: 15, fontWeight: '600', color: colors.ink },
  buySub: { fontSize: 12, color: colors.inkSoft },
  price: {
    backgroundColor: colors.good,
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 6,
    minWidth: 72,
    alignItems: 'center',
  },
  priceText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  barBg: { backgroundColor: 'rgba(0,0,0,0.25)', overflow: 'hidden', width: '100%' },
  stat: { alignItems: 'center', flex: 1, paddingVertical: space.xs },
  statValue: { fontSize: 17, fontWeight: '700', color: colors.ink },
  statLabel: { fontSize: 11, color: colors.inkSoft },
  chip: {
    minHeight: 36,
    paddingHorizontal: space.md,
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.woodLight,
    backgroundColor: colors.parchment,
  },
  chipText: { fontWeight: '600', color: colors.ink },
});
