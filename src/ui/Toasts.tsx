import { StyleSheet, Text, View } from 'react-native';
import { HOUSES } from '../data/houses';
import { HAT_LINES_FR, t } from '../i18n';
import { useGame } from '../state/store';
import { Crest } from './Crest';
import { Hat } from './Hat';
import { colors, radius, space } from './theme';

/** Annonces : répartition du Chapeau, départs, Coupe des Maisons. */
export function Toasts() {
  const toasts = useGame((s) => s.toasts);
  // Une seule annonce à la fois (la plus récente).
  const visible = toasts.slice(-1);
  if (!visible.length) return null;
  return (
    <View style={styles.wrap} pointerEvents="none">
      {visible.map((x) => {
        if (x.kind === 'graduated' || x.kind === 'event' || x.kind === 'relic') {
          const border =
            x.kind === 'graduated' && x.house
              ? HOUSES[x.house].color
              : x.kind === 'relic'
                ? colors.gold
                : colors.woodLight;
          return (
            <View key={x.key} style={[styles.toast, { borderColor: border }]}>
              <Text style={{ fontSize: 26 }}>{x.icon}</Text>
              <Text style={[styles.title, { flex: 1, marginLeft: space.sm }]}>{x.title}</Text>
              {x.kind === 'graduated' && x.house ? <Crest house={x.house} size={32} /> : null}
            </View>
          );
        }
        if (x.kind === 'sorted' && x.house) {
          return (
            <View key={x.key} style={[styles.toast, { borderColor: HOUSES[x.house].color }]}>
              <Hat size={36} talking />
              <View style={{ flex: 1, marginHorizontal: space.sm }}>
                <Text style={styles.title}>
                  {t('event.sorted', { name: x.title, house: t(`house.${x.house}`) })}
                </Text>
                <Text style={styles.line} numberOfLines={2}>
                  « {HAT_LINES_FR[x.line ?? 0]} »
                </Text>
              </View>
              <Crest house={x.house} size={36} />
            </View>
          );
        }
        if (x.kind === 'cup' && x.house) {
          return (
            <View key={x.key} style={[styles.toast, { borderColor: colors.gold }]}>
              <Text style={{ fontSize: 28 }}>🏆</Text>
              <Text style={[styles.title, { flex: 1, marginHorizontal: space.sm }]}>
                {t('event.cupWon', { house: t(`house.${x.house}`) })} +{x.title} 💰
              </Text>
              <Crest house={x.house} size={36} />
            </View>
          );
        }
        return (
          <View
            key={x.key}
            style={[styles.toast, { borderColor: colors.bad, backgroundColor: '#FBE3DF' }]}
          >
            <Text style={{ fontSize: 22 }}>😤</Text>
            <Text style={[styles.title, { flex: 1, marginLeft: space.sm }]}>
              {t('event.left', { name: x.title })}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 52, left: space.sm, right: space.sm, gap: 6 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.parchment,
    borderRadius: radius.md,
    borderWidth: 3,
    padding: space.sm,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  title: { fontWeight: '800', color: colors.ink, fontSize: 14 },
  line: { fontStyle: 'italic', color: colors.inkSoft, fontSize: 12 },
});
