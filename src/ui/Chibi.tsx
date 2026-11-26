import { Image, View } from 'react-native';
import { SPRITES, type SpriteName } from '../assets';
import { HOUSE_IDS } from '../data/houses';
import type { Student } from '../engine';

/** Sprite de l'élève : 2 variantes par Maison ; robe grise tant qu'il n'est pas réparti. */
export function studentSprite(s: Student, back = false): SpriteName {
  const v = s.id % 2;
  const b = back ? '-back' : '';
  if (s.house) return `${s.house}-${v}${b}` as SpriteName;
  return `${HOUSE_IDS[s.id % 4]}-${v}${b}-unsorted` as SpriteName;
}

/** Élève chibi (sprite SpriteCook). `size` = hauteur affichée. */
export function Chibi({
  student,
  size = 22,
  sleeping = false,
  back = false,
}: {
  student: Student;
  size?: number;
  sleeping?: boolean;
  back?: boolean;
}) {
  const d = SPRITES[studentSprite(student, back)];
  const w = (size * d.w) / d.h;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      <Image
        source={d.src}
        style={{
          width: w,
          height: size,
          transform: sleeping ? [{ rotate: '-75deg' }, { scale: 0.85 }] : undefined,
        }}
        resizeMode="contain"
      />
    </View>
  );
}
