import { StyleSheet, View } from 'react-native';
import { HOUSES } from '../data/houses';
import type { Student } from '../engine';
import { HAIR_COLORS, SKIN_TONES } from './theme';

/**
 * Élève chibi (grosse tête) en formes simples — placeholder propre
 * en attendant les sprites du jalon J6.
 */
function ChibiBase({
  student,
  size = 22,
  sleeping = false,
}: {
  student: Student;
  size?: number;
  sleeping?: boolean;
}) {
  const head = size * 0.62;
  const robe = student.house ? HOUSES[student.house].color : '#6B6B7A';
  const hair = HAIR_COLORS[student.look.hair];
  const style = student.look.hairStyle;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', opacity: sleeping ? 0.85 : 1 }}>
      <View
        style={[
          styles.body,
          {
            width: size * 0.62,
            height: size * 0.45,
            top: size * 0.52,
            backgroundColor: robe,
            borderTopLeftRadius: size * 0.3,
            borderTopRightRadius: size * 0.3,
          },
        ]}
      />
      <View
        style={[
          styles.head,
          {
            width: head,
            height: head,
            borderRadius: head / 2,
            backgroundColor: SKIN_TONES[student.look.skin],
          },
        ]}
      >
        <View
          style={{
            position: 'absolute',
            top: -1,
            left: style === 3 ? head * 0.1 : -1,
            right: style === 2 ? head * 0.1 : -1,
            height: head * (style === 1 ? 0.6 : 0.42),
            backgroundColor: hair,
            borderTopLeftRadius: head / 2,
            borderTopRightRadius: head / 2,
            borderBottomLeftRadius: style === 1 ? head * 0.1 : 0,
            borderBottomRightRadius: style === 1 ? head * 0.1 : 0,
          }}
        />
        {sleeping ? (
          <View style={[styles.eyesClosed, { top: head * 0.55, width: head * 0.5 }]} />
        ) : (
          <View style={[styles.eyes, { top: head * 0.52, width: head * 0.45 }]}>
            <View style={styles.eye} />
            <View style={styles.eye} />
          </View>
        )}
      </View>
    </View>
  );
}

export const Chibi = ChibiBase;

const styles = StyleSheet.create({
  body: { position: 'absolute' },
  head: { overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.25)' },
  eyes: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eye: { width: 2.5, height: 2.5, borderRadius: 2, backgroundColor: '#2E2118' },
  eyesClosed: {
    position: 'absolute',
    alignSelf: 'center',
    height: 1.5,
    backgroundColor: '#2E2118',
  },
});
