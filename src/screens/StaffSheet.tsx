import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PORTRAITS } from '../assets/portraits';
import { COURSE_IDS, COURSES } from '../data/courses';
import { NAMED_PROFESSORS, PROF_UPGRADE, professorLabel } from '../data/professors';
import { profLevel, profUpgradeCost } from '../engine';
import { t } from '../i18n';
import { useGame, useTick } from '../state/store';
import { colors, formatNumber, radius, space } from '../ui/theme';

/** Salle des professeurs : une carte par prof (portrait, niveau, amélioration). */
export function StaffSheet() {
  useTick();
  const game = useGame((s) => s.game);
  const store = useGame.getState();
  const close = () => store.select(null);
  return (
    <Modal visible animationType="slide" transparent onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} />
      <View style={styles.sheet}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Salle des professeurs</Text>
          <Pressable onPress={close} style={styles.close} accessibilityLabel={t('room.close')}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>
        <Text style={styles.intro}>
          Chaque niveau : cours {Math.round(PROF_UPGRADE.timePerLevel * 100)} % plus court et +
          {Math.round(PROF_UPGRADE.coinPerLevel * 100)} % d’Éclats dans sa salle.
        </Text>
        <ScrollView contentContainerStyle={styles.grid}>
          {COURSE_IDS.map((cid) => {
            const prof = NAMED_PROFESSORS[cid];
            const built = !!game.stations[`course-${cid}`];
            const lvl = profLevel(game, cid);
            const cost = profUpgradeCost(game, cid);
            const can = cost !== null && game.coins >= cost;
            const src = PORTRAITS[cid];
            return (
              <View key={cid} style={[styles.card, !built && styles.cardLocked]}>
                <View style={styles.lvlBadge}>
                  <Text style={styles.lvlText}>Niv. {lvl}</Text>
                </View>
                <View style={styles.portraitBox}>
                  {src ? (
                    <Image
                      source={src}
                      style={[styles.portrait, !built && { opacity: 0.35 }]}
                      resizeMode="contain"
                    />
                  ) : null}
                </View>
                <Text style={styles.name} numberOfLines={1}>
                  {prof ? professorLabel(prof) : '—'}
                </Text>
                <Text style={styles.course} numberOfLines={1}>
                  {COURSES[cid].icon} {t(`course.${cid}`)}
                </Text>
                <View style={styles.bar}>
                  <View
                    style={[styles.barFill, { width: `${(lvl / PROF_UPGRADE.maxLevel) * 100}%` }]}
                  />
                </View>
                {!built ? (
                  <Text style={styles.locked}>🔒 Salle à construire</Text>
                ) : cost === null ? (
                  <Text style={styles.max}>★ Niveau maximum</Text>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    onPress={can ? () => store.upgradeProf(cid) : undefined}
                    style={[styles.btn, !can && styles.btnOff]}
                  >
                    <Text style={styles.btnLabel}>Améliorer</Text>
                    <Text style={styles.btnCost}>💰 {formatNumber(cost)}</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    maxHeight: '88%',
    backgroundColor: '#E9D2A6',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 4,
    borderColor: '#8A5A2B',
    paddingBottom: space.xl,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8A5A2B',
    paddingVertical: space.sm,
    borderTopLeftRadius: radius.lg - 4,
    borderTopRightRadius: radius.lg - 4,
  },
  bannerText: { color: '#FFF3D6', fontWeight: '900', fontSize: 18 },
  close: {
    position: 'absolute',
    right: space.sm,
    backgroundColor: '#C0392B',
    borderRadius: 6,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  intro: { color: colors.ink, textAlign: 'center', margin: space.sm, fontSize: 13 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: space.sm,
    gap: space.sm,
  },
  card: {
    width: '48.5%',
    backgroundColor: '#3E4A6B',
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: '#C9A25A',
    padding: space.sm,
    alignItems: 'center',
  },
  cardLocked: { backgroundColor: '#4A4A50', borderColor: '#7A7A80' },
  lvlBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#2B1A0E',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 1,
  },
  lvlText: { color: '#FFD86B', fontWeight: '900', fontSize: 12 },
  portraitBox: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.sm,
  },
  portrait: { width: 70, height: 116 },
  name: { color: '#FFF3D6', fontWeight: '900', marginTop: 4, fontSize: 13 },
  course: { color: '#D9C7A0', fontSize: 12 },
  bar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 3,
    marginVertical: 6,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: '#E07B2E' },
  btn: {
    width: '100%',
    backgroundColor: '#5FAE3A',
    borderRadius: radius.sm,
    borderBottomWidth: 3,
    borderColor: '#3D7A22',
    alignItems: 'center',
    paddingVertical: 4,
  },
  btnOff: { backgroundColor: '#8A8F94', borderColor: '#6A6F74' },
  btnLabel: { color: '#fff', fontWeight: '900' },
  btnCost: { color: '#FFF3C4', fontWeight: '800', fontSize: 12 },
  locked: { color: '#D0D0D0', fontWeight: '700', fontSize: 12, paddingVertical: 6 },
  max: { color: '#FFD86B', fontWeight: '800', fontSize: 12, paddingVertical: 6 },
});
