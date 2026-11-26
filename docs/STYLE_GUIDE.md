# Bible de style — Arcanum Academy

## Ambiance

Manoir de conte de fées, cartoon chaleureux et cosy : bois chaud, parchemin, lueurs de bougie, lumière dorée. Contours doux, jamais d'angles agressifs.

## Palette

| Rôle               | Couleur               |
| ------------------ | --------------------- |
| Nuit / ciel        | `#1E1830`             |
| Bois foncé / clair | `#3B2414` / `#8A5A34` |
| Parchemin          | `#F6E9CC`             |
| Bougie / or        | `#FFD86B` / `#F2B83B` |
| Pyrraxe            | `#C0392B`             |
| Sylvaine           | `#1E8449`             |
| Aurélis            | `#F4C430`             |
| Azuréa             | `#2471A3`             |

## Blasons (`src/ui/Crest.tsx`)

Écu bordé de bois foncé. L'emblème est crème (`#FFF6E0`) et sa **forme est propre à chaque Maison**, pour rester lisible par les personnes daltoniennes et à 32 px :

- Pyrraxe : flamme-phénix aux ailes pointues
- Sylvaine : tête de cerf à ramure de feuilles
- Aurélis : soleil à 12 rayons, abeille au centre
- Azuréa : hippocampe sur une vague

## Personnages

Chibi (tête ≈ 60 % de la hauteur), robe aux couleurs de la Maison (gris tant que l'élève n'est pas réparti). 6 teintes de peau, 8 couleurs de cheveux, 4 coiffures. Au J6, il faudra des sprites animés (marche, assis, écrit, dort, lévite) qui respectent ces proportions.

## Méliandre, le Chapeau Songeur

Chapeau pointu brun, rapiécé avec des coutures en pointillés, yeux brodés en arcs, bouche cousue en zigzag (ovale quand il parle).

## Salles

Chaque matière a une couleur de mur (`wall` dans `src/data/courses.ts`). Trois paliers d'aspect : modeste (niv. 1 à 3), confortable (niv. 4 à 7, moulure dorée), prestigieuse (niv. 8 à 10, double moulure or).

## Interface

Boutons d'au moins 48 dp, prix dans une pastille verte (grise si trop cher). Titres en serif (Georgia / serif), texte en police système.
