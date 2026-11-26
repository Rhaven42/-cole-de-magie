import { Image, View } from 'react-native';
import { SPRITES } from '../assets';
import type { HouseId } from '../data/houses';
import { t } from '../i18n';

/**
 * Blasons pixel art des Maisons (SpriteCook) : griffon cuivré (Griffebraise),
 * renard noir (Renardombre), corbeau argenté (Corvencre), cerf aux ronces (Cerfronce).
 * Chaque emblème a une silhouette distincte pour rester lisible sans la couleur.
 */
export function Crest({ house, size = 32 }: { house: HouseId; size?: number }) {
  const d = SPRITES[`crest_${house}`];
  const w = (size * d.w) / d.h;
  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessibilityLabel={t(`house.${house}`)}
    >
      <Image source={d.src} style={{ width: w, height: size }} resizeMode="contain" />
    </View>
  );
}
