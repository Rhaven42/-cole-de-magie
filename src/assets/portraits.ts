import type { ImageSourcePropType } from 'react-native';
import type { CourseId } from '../data/courses';

/** Portraits pixel art des professeur·es (SpriteCook, voir spritecook-assets.json). */
export const PORTRAITS: Partial<Record<CourseId, ImageSourcePropType>> = {
  charms: require('./portraits/taladon.png'),
  transfiguration: require('./portraits/tenarius.png'),
  defense: require('./portraits/harvald.png'),
  potions: require('./portraits/dolohov.png'),
  botany: require('./portraits/solomon.png'),
  astronomy: require('./portraits/alva.png'),
  flying: require('./portraits/harwen.png'),
  divination: require('./portraits/rhaven.png'),
  history: require('./portraits/morgenvar.png'),
  duel: require('./portraits/delan.png'),
};

/** Les mêmes professeur·es, assis (repas, pause entre deux cours). Regardent en bas à gauche. */
export const PORTRAITS_SIT: Partial<Record<CourseId, ImageSourcePropType>> = {
  charms: require('./portraits/sit/taladon.png'),
  transfiguration: require('./portraits/sit/tenarius.png'),
  defense: require('./portraits/sit/harvald.png'),
  potions: require('./portraits/sit/dolohov.png'),
  botany: require('./portraits/sit/solomon.png'),
  astronomy: require('./portraits/sit/alva.png'),
  flying: require('./portraits/sit/harwen.png'),
  divination: require('./portraits/sit/rhaven.png'),
  history: require('./portraits/sit/morgenvar.png'),
  duel: require('./portraits/sit/delan.png'),
};

/** Hauteur d'un·e prof assis·e par rapport à debout. */
export const PROF_SIT_SCALE = 0.7;
