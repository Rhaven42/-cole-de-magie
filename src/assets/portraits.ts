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
