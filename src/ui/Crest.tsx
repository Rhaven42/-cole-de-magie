import Svg, { Circle, G, Path } from 'react-native-svg';
import { HOUSES, type HouseId } from '../data/houses';

/**
 * Blasons originaux. Chaque Maison a une forme d'emblème distincte
 * (flamme-phénix, ramure, soleil, hippocampe-vague) pour rester lisible
 * sans la couleur (daltonisme) et à 32 px.
 */
const SHIELD = 'M50 4 L92 16 L92 52 C92 76 72 92 50 98 C28 92 8 76 8 52 L8 16 Z';

function Emblem({ house }: { house: HouseId }) {
  const fill = '#FFF6E0';
  switch (HOUSES[house].emblem) {
    case 'phoenix':
      // Flamme / ailes de phénix stylisées
      return (
        <G fill={fill}>
          <Path d="M50 22 C58 36 70 40 66 58 C64 70 56 78 50 80 C44 78 36 70 34 58 C30 40 42 36 50 22 Z" />
          <Path
            d="M50 44 C54 52 58 56 56 64 C54 70 50 72 50 72 C50 72 46 70 44 64 C42 56 46 52 50 44 Z"
            fill={HOUSES.pyrraxe.color}
          />
          <Path d="M30 46 L18 34 L22 52 Z M70 46 L82 34 L78 52 Z" />
        </G>
      );
    case 'stag':
      // Tête de cerf avec ramure de feuilles
      return (
        <G fill={fill}>
          <Path d="M42 50 L58 50 L56 70 L50 80 L44 70 Z" />
          <Path d="M44 50 C36 44 30 36 30 24 L34 24 C34 32 38 38 44 42 Z M56 50 C64 44 70 36 70 24 L66 24 C66 32 62 38 56 42 Z" />
          <Path d="M30 24 C24 20 24 14 28 12 C32 16 32 20 30 24 Z M70 24 C76 20 76 14 72 12 C68 16 68 20 70 24 Z" />
          <Path d="M34 34 C26 34 22 30 22 26 C28 26 32 30 34 34 Z M66 34 C74 34 78 30 78 26 C72 26 68 30 66 34 Z" />
        </G>
      );
    case 'sun':
      // Soleil rayonnant avec une abeille au centre
      return (
        <G>
          <G fill={fill}>
            {Array.from({ length: 12 }, (_, i) => (
              <Path key={i} d="M50 18 L54 32 L46 32 Z" transform={`rotate(${i * 30} 50 52)`} />
            ))}
            <Circle cx={50} cy={52} r={18} />
          </G>
          <G fill="#3A2A10">
            <Path d="M43 50 L57 50 L57 54 L43 54 Z M44 57 L56 57 L56 60 L44 60 Z" />
            <Circle cx={50} cy={44} r={4} />
          </G>
        </G>
      );
    case 'seahorse':
    default:
      // Hippocampe stylisé sur une vague
      return (
        <G fill={fill}>
          <Path d="M56 22 C66 22 70 30 64 36 L58 40 C62 46 62 56 54 64 C48 70 52 78 58 76 C56 84 44 84 42 76 C40 66 50 60 48 50 C46 44 42 44 40 40 C44 40 46 36 46 32 C46 26 50 22 56 22 Z" />
          <Path d="M20 84 C28 76 36 76 44 84 C52 92 60 92 68 84 C74 78 80 78 84 82 L84 88 C78 84 74 86 70 90 C60 98 50 96 42 90 C34 84 28 84 20 90 Z" />
        </G>
      );
  }
}

export function Crest({ house, size = 32 }: { house: HouseId; size?: number }) {
  const def = HOUSES[house];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel={house}>
      <Path d={SHIELD} fill={def.color} stroke="#3B2414" strokeWidth={5} />
      <Path
        d="M50 10 L86 20 L86 52 C86 72 70 86 50 92"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity={0.25}
        strokeWidth={4}
      />
      <Emblem house={house} />
    </Svg>
  );
}
