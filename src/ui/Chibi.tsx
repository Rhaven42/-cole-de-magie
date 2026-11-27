import { Image, View } from 'react-native';
import { SPRITES, type SpriteName } from '../assets';
import { HOUSE_IDS } from '../data/houses';
import type { Student } from '../engine';

export type Pose = 'stand' | 'walk' | 'sit';

/** Hauteur relative d'un élève assis (le sprite assis est plus court). */
export const SIT_SCALE = { front: 0.74, back: 0.7 } as const;

/**
 * Sprite de l'élève : 2 variantes par Maison ; robe grise tant qu'il n'est pas réparti.
 * Poses : debout, en marche (pas en avant), assis (repas). Repli sur « debout » si absente.
 */
export function studentSprite(s: Student, back = false, pose: Pose = 'stand'): SpriteName {
  const v = s.id % 2;
  const b = back ? '-back' : '';
  if (s.house) {
    if (pose !== 'stand') {
      const p = `${s.house}-${v}-${pose}${b}` as SpriteName;
      if (p in SPRITES) return p;
    }
    return `${s.house}-${v}${b}` as SpriteName;
  }
  return `${HOUSE_IDS[s.id % 4]}-${v}${b}-unsorted` as SpriteName;
}

/** Élève (sprite SpriteCook). `size` = hauteur affichée debout. */
export function Chibi({
  student,
  size = 22,
  sleeping = false,
  back = false,
  pose = 'stand',
}: {
  student: Student;
  size?: number;
  sleeping?: boolean;
  back?: boolean;
  pose?: Pose;
}) {
  const name = studentSprite(student, back, pose);
  const d = SPRITES[name];
  const seated = pose === 'sit' && name.includes('-sit');
  const h = seated ? size * (back ? SIT_SCALE.back : SIT_SCALE.front) : size;
  const w = (h * d.w) / d.h;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      <Image
        source={d.src}
        style={{
          width: w,
          height: h,
          transform: sleeping ? [{ rotate: '-75deg' }, { scale: 0.85 }] : undefined,
        }}
        resizeMode="contain"
      />
    </View>
  );
}
