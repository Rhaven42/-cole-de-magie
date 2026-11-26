import { Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '../i18n';
import { colors, TOUCH } from './theme';

export type Tab = 'school' | 'shop' | 'students' | 'houses' | 'settings';
const TABS: { id: Tab; icon: string }[] = [
  { id: 'school', icon: '🏰' },
  { id: 'shop', icon: '🛒' },
  { id: 'students', icon: '🎓' },
  { id: 'houses', icon: '🏆' },
  { id: 'settings', icon: '⚙️' },
];

export function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <View style={styles.bar}>
      {TABS.map((x) => (
        <Pressable
          key={x.id}
          onPress={() => onChange(x.id)}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === x.id }}
          style={[styles.tab, tab === x.id && styles.active]}
        >
          <Text style={styles.icon}>{x.icon}</Text>
          <Text style={[styles.label, tab === x.id && { color: colors.candle }]}>
            {t(`tab.${x.id}`)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.woodDark,
    borderTopWidth: 3,
    borderTopColor: colors.goldDark,
  },
  tab: { flex: 1, minHeight: TOUCH + 8, alignItems: 'center', justifyContent: 'center' },
  active: { backgroundColor: colors.wood },
  icon: { fontSize: 20 },
  label: { fontSize: 11, color: colors.parchment, fontWeight: '600' },
});
