import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { HOUSES } from '../data/houses';
import { CAREERS, YEARS } from '../data/progression';
import { chooseCareer, coursesForYear, type Student } from '../engine';
import { t } from '../i18n';
import { Chibi } from '../ui/Chibi';
import { Crest } from '../ui/Crest';
import { Bar, stationName, Title } from '../ui/kit';
import { colors, radius, space } from '../ui/theme';
import { useGame, useTick } from '../state/store';

export function activityLabel(s: Student): string {
  const game = useGame.getState().game;
  const a = s.activity;
  if (a.mode === 'free') return t('state.free');
  const st = game.stations[a.stationId];
  const place = st ? stationName(st) : '?';
  return a.mode === 'queue' ? t('state.queue', { place }) : t('state.service', { place });
}

export function Gauge({ label, v, color }: { label: string; v: number; color: string }) {
  return (
    <View style={styles.gauge}>
      <Text style={styles.gaugeLabel}>{label}</Text>
      <View style={{ flex: 1 }}>
        <Bar value={v / 100} color={color} height={8} />
      </View>
      <Text style={styles.gaugeVal}>{Math.round(v)}</Text>
    </View>
  );
}

/** Contenu de la fiche élève (réutilisé dans la liste des élèves). */
export function StudentDetails({ s }: { s: Student }) {
  const fav = Object.entries(s.passedBy).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0];
  const career = chooseCareer(s);
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.sub}>
        {s.house ? t(`house.${s.house}`) : t('students.unsorted')} · {t(`trait.${s.trait}`)}
      </Text>
      <Text style={styles.line}>
        {t('student.year', { n: s.year, p: s.yearPassed, t: coursesForYear(s.year) })}
      </Text>
      <Bar value={s.yearPassed / coursesForYear(s.year)} color={colors.gold} height={8} />
      {s.year >= YEARS.max ? <Text style={styles.sub}>⭐ {t('student.advanced')}</Text> : null}
      <Text style={styles.sub}>
        {t('students.passed', { n: s.coursesPassed })} · {s.xp} XP
      </Text>
      {fav ? (
        <Text style={styles.sub}>{t('student.favorite', { c: t(`course.${fav[0]}`) })}</Text>
      ) : null}
      {fav ? (
        <Text style={styles.sub}>
          {CAREERS[career].icon} {t('student.career', { c: t(`career.${career}`) })}
        </Text>
      ) : null}
      <Text style={styles.sub}>📍 {activityLabel(s)}</Text>
      <Gauge label={t('students.fatigue')} v={s.fatigue} color="#7FA7D9" />
      <Gauge label={t('students.hunger')} v={Math.min(s.hunger, 100)} color="#E39B4F" />
      <Gauge label={t('students.mood')} v={s.mood} color={colors.good} />
    </View>
  );
}

/** Fiche ouverte en touchant un élève sur la carte. */
export function StudentSheet() {
  useTick();
  const id = useGame((s) => s.student);
  const game = useGame((s) => s.game);
  const s = id !== null ? game.students[id] : undefined;
  if (id === null) return null;
  const close = () => useGame.getState().selectStudent(null);
  return (
    <Modal visible transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} />
      <View style={[styles.sheet, s?.house && { borderColor: HOUSES[s.house].color }]}>
        {s ? (
          <>
            <View style={styles.head}>
              <Chibi student={s} size={52} />
              <View style={{ flex: 1, marginHorizontal: space.md }}>
                <Title>{s.name}</Title>
              </View>
              {s.house ? <Crest house={s.house} size={48} /> : null}
            </View>
            <StudentDetails s={s} />
          </>
        ) : (
          <Text style={styles.line}>🎓 Cet élève a quitté l’école (diplômé·e !).</Text>
        )}
        <Pressable style={styles.btn} onPress={close}>
          <Text style={styles.btnText}>{t('room.close')}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: colors.parchment,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 5,
    borderColor: colors.woodLight,
    padding: space.lg,
    gap: space.sm,
  },
  head: { flexDirection: 'row', alignItems: 'center' },
  sub: { color: colors.inkSoft, fontSize: 13 },
  line: { color: colors.ink, fontWeight: '700' },
  gauge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gaugeLabel: { width: 60, fontSize: 12, color: colors.inkSoft },
  gaugeVal: { width: 28, textAlign: 'right', fontSize: 12, color: colors.ink },
  btn: {
    marginTop: space.sm,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.woodLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: colors.white, fontWeight: '800' },
});
