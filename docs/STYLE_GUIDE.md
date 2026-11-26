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
| Griffebraise       | `#C0392B`             |
| Renardombre        | `#1E8449`             |
| Cerfronce          | `#D9A21E`             |
| Corvencre          | `#2471A3`             |

## Blasons (`src/ui/Crest.tsx`)

Écu bordé de bois foncé. L'emblème est crème (`#FFF6E0`) et sa **forme est propre à chaque Maison**, pour rester lisible par les personnes daltoniennes et à 32 px :

- Griffebraise : griffon cuivré (courage, audace)
- Renardombre : renard noir (ruse, indépendance)
- Cerfronce : cerf aux bois entrelacés de ronces (loyauté, ténacité)
- Corvencre : corbeau argenté (curiosité, imagination)

## Personnages

Chibi (tête ≈ 60 % de la hauteur), robe aux couleurs de la Maison (gris tant que l'élève n'est pas réparti). 6 teintes de peau, 8 couleurs de cheveux, 4 coiffures. Au J6, il faudra des sprites animés (marche, assis, écrit, dort, lévite) qui respectent ces proportions.

## Le Chaporacle (chapeau de répartition)

Chapeau pointu brun, rapiécé avec des coutures en pointillés, yeux brodés en arcs, bouche cousue en zigzag (ovale quand il parle).

## Vue isométrique

Vue de 3/4 (tuiles losanges de 40 × 20 px), murs arrière couleur plâtre avec lambris en bois, murets avant bas (vue « maison de poupée »), couloirs en parquet chaud, jardins et fontaine autour. Chaque salle a son sol (damier) et ses meubles : chaudrons, pots de fleurs, pupitres, estrades, télescopes, lits aux couleurs des Maisons, longues tables de la Grande Salle. Élèves : chibis avec chapeau pointu à la couleur de leur Maison.

## Salles

Chaque matière a une couleur de mur (`wall` dans `src/data/courses.ts`). Trois paliers d'aspect : modeste (niv. 1 à 3), confortable (niv. 4 à 7, moulure dorée), prestigieuse (niv. 8 à 10, double moulure or).

## Interface

Boutons d'au moins 48 dp, prix dans une pastille verte (grise si trop cher). Titres en serif (Georgia / serif), texte en police système.

## Sprites (SpriteCook)

- Planches générées en « clean flat cartoon, soft cel shading, warm cozy colors, thin dark brown outlines ». La planche de meubles n°1 (`c6386d51…`) sert de **référence de style** pour toutes les suivantes (voir `spritecook-assets.json`).
- Vue isométrique 3/4, objets ancrés en bas au centre sur leur case (`Sprite` dans `src/ui/isoArt.tsx`).
- **3 paliers d'évolution** par objet : de base (niv. 1–2), amélioré (niv. 3–4 : laiton, argent, étincelles bleues), légendaire (niv. 5 : or, marbre blanc, aura dorée, tissus violet royal). Fichiers `nom.png`, `nom-2.png`, `nom-3.png`.
- Élèves : 2 variantes par Maison (`maison-0/1.png`) et une version désaturée `-unsorted` avant la répartition.
- Sols et murs restent dessinés en SVG (géométrie exacte, couleurs par environnement).
