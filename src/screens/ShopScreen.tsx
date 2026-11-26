import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { COURSE_IDS, COURSES } from '../data/courses';
import { MANAGERS } from '../data/managers';
import { courseCost, dormCost, dormCount, examCost, managerCost } from '../engine';
import { t } from '../i18n';
import { BuyButton, Title } from '../ui/kit';
import { colors, formatDuration, radius, space } from '../ui/theme';
import { useGame, useTick } from '../state/store';

export function ShopScreen() {
  useTick();
  const game = useGame((s) => s.game);
  const store = useGame.getState();
  const ownedCourses = COURSE_IDS.filter((id) => game.stations[`course-${id}`]);
  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.content}>
      <Title>{t('shop.rooms')}</Title>
      {COURSE_IDS.map((id) => {
        const def = COURSES[id];
        const owned = !!game.stations[`course-${id}`];
        const sub = `1 place à l’ouverture · ${formatDuration(def.duration)} · ${def.reward} 💰 · ${t('shop.yearMin', { n: def.yearMin })}`;
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
      {game.stations.exam ? (
        <View style={styles.owned}>
          <Text style={styles.ownedText}>📝 Salle des Examens</Text>
          <Text style={styles.ownedTag}>✓ {t('shop.owned')}</Text>
        </View>
      ) : (
        <BuyButton
          icon="📝"
          label="Salle des Examens"
          sub="Examen final : diplôme, métier et grade selon les matières suivies"
          cost={examCost(game)}
          coins={game.coins}
          onPress={() => store.buyExam()}
        />
      )}
      <Title style={{ marginTop: space.lg }}>{t('shop.dorms')}</Title>
      <BuyButton
        icon="🛏️"
        label={`${t('shop.newDorm')} (${dormCount(game)})`}
        sub="4 lits · plus de places de sommeil, plus d’élèves accueillis"
        cost={dormCost(game)}
        coins={game.coins}
        onPress={() => store.buyDorm()}
      />
      <Title style={{ marginTop: space.lg }}>👔 {t('shop.managers')}</Title>
      <Text style={styles.note}>{t('room.managerSub')}</Text>
      {ownedCourses.map((id) => {
        const sid = `course-${id}`;
        if (game.managers[sid]) {
          return (
            <View key={id} style={styles.owned}>
              <Text style={styles.ownedText}>
                {COURSES[id].icon} {MANAGERS[id]}
              </Text>
              <Text style={styles.ownedTag}>✓</Text>
            </View>
          );
        }
        return (
          <BuyButton
            key={id}
            icon={COURSES[id].icon}
            label={MANAGERS[id]}
            sub={t(`course.${id}`)}
            cost={managerCost(game, sid)}
            coins={game.coins}
            onPress={() => store.hireManager(sid)}
          />
        );
      })}
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
  note: { marginVertical: space.sm, color: colors.inkSoft, fontStyle: 'italic' },
});
