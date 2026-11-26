import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { COURSE_IDS, COURSES, UNLOCKED_COURSES } from '../data/courses';
import { courseCost, dormCost, dormCount } from '../engine';
import { t } from '../i18n';
import { BuyButton, Title } from '../ui/kit';
import { colors, formatDuration, radius, space } from '../ui/theme';
import { useGame, useTick } from '../state/store';

export function ShopScreen() {
  useTick();
  const game = useGame((s) => s.game);
  const store = useGame.getState();
  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.content}>
      <Title>{t('shop.rooms')}</Title>
      {COURSE_IDS.map((id) => {
        const def = COURSES[id];
        const owned = !!game.stations[`course-${id}`];
        const sub = `${def.seats} places · ${formatDuration(def.duration)} · ${def.reward} 💰 · ${t('shop.yearMin', { n: def.yearMin })}`;
        if (owned) {
          return (
            <View key={id} style={styles.owned}>
              <Text style={styles.ownedText}>
                {def.icon} {t(`course.${id}`)}
              </Text>
              <Text style={styles.ownedTag}>✓ {t('shop.owned')}</Text>
            </View>
          );
        }
        if (!UNLOCKED_COURSES.includes(id)) {
          return (
            <View key={id} style={[styles.owned, { opacity: 0.55 }]}>
              <Text style={styles.ownedText}>🔒 {t(`course.${id}`)}</Text>
              <Text style={styles.ownedTag}>{t('shop.comingSoon')}</Text>
            </View>
          );
        }
        return (
          <BuyButton
            key={id}
            icon={def.icon}
            label={t(`course.${id}`)}
            sub={sub}
            cost={courseCost(game, id)}
            coins={game.coins}
            onPress={() => store.buyCourse(id)}
          />
        );
      })}
      <Title style={{ marginTop: space.lg }}>{t('shop.dorms')}</Title>
      <BuyButton
        icon="🛏️"
        label={`${t('shop.newDorm')} (${dormCount(game)})`}
        sub="4 lits · plus de places de sommeil, plus d’élèves accueillis"
        cost={dormCost(game)}
        coins={game.coins}
        onPress={() => store.buyDorm()}
      />
      <Text style={styles.note}>
        Lits, décoration, matériel, fournisseurs et professeurs arrivent au jalon J5.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.parchmentDark },
  content: { padding: space.lg },
  owned: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: space.md,
    marginVertical: space.xs,
    borderRadius: radius.md,
    backgroundColor: colors.parchment,
    borderWidth: 1,
    borderColor: colors.woodLight,
  },
  ownedText: { flex: 1, fontWeight: '600', color: colors.ink },
  ownedTag: { color: colors.good, fontWeight: '700' },
  note: { marginTop: space.lg, color: colors.inkSoft, fontStyle: 'italic' },
});
