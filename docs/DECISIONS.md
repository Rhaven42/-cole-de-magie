# Décisions techniques et de design

Chaque décision peut être remise en question ; elle est notée ici pour garder une trace.

## Stack

| Sujet              | Choix                                                                                                                      | Pourquoi                                                                                                                                                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | **Expo SDK 58 + React Native 0.88 + TypeScript strict**                                                                    | Testable immédiatement dans Expo Go, builds Android/iOS via EAS sans Mac.                                                                                                                                                                                  |
| Navigation         | **Barre d'onglets maison** (état React), pas d'Expo Router                                                                 | 5 écrans + des fenêtres modales : un routeur n'apporte rien et ajoute des dépendances.                                                                                                                                                                     |
| État               | **Zustand**                                                                                                                | Léger. Le store contient l'objet `GameState` du moteur, modifié en place à chaque tick, et un compteur `rev` auquel les écrans s'abonnent. Évite de copier tout l'état 4 fois par seconde.                                                                 |
| Persistance        | **AsyncStorage** (JSON versionné)                                                                                          | Inclus dans Expo Go (MMKV demanderait un _development build_). Migrations dans `src/engine/save.ts`.                                                                                                                                                       |
| Rendu de l'école   | **Vue isométrique** dessinée en `react-native-svg` (sol, murs, meubles), élèves en vues animées (`Animated`, pilote natif) | Style « idle tycoon » demandé (salles ouvertes vues de 3/4, couloirs en parquet). Le décor SVG n'est redessiné que si le plan change ; seuls les élèves bougent à chaque tick. Des sprites pourront remplacer les primitives au J6 sans toucher au moteur. |
| Déplacement / zoom | **react-native-gesture-handler 3 + Reanimated 4** (glisser, pincer, toucher une salle) + boutons +/−                       | Inclus dans Expo Go, gestes fluides sur le thread UI.                                                                                                                                                                                                      |
| Tests              | **Jest + ts-jest** sur `src/engine` uniquement                                                                             | Le moteur est du TypeScript pur, sans React Native : tests rapides et déterministes.                                                                                                                                                                       |
| Simulation         | Tick fixe **250 ms**, RNG **mulberry32** dont l'état est sauvegardé                                                        | Déterminisme : même graine → même partie (testé).                                                                                                                                                                                                          |
| Hors-ligne         | Rattrapage par pas de **1 s**, plafonné à **8 h**                                                                          | 4× moins coûteux que le tick temps réel, assez fin pour des services de 8 s minimum.                                                                                                                                                                       |
| Lint               | ESLint (`eslint-config-expo`) + Prettier                                                                                   | Standard Expo.                                                                                                                                                                                                                                             |

## Architecture

```
src/data/      ← TOUT l'équilibrage (cours, Maisons, lieux, économie, formules, noms)
src/engine/    ← moteur pur TS : types, tick, achats, conseiller, sauvegarde, hors-ligne
src/state/     ← store Zustand, boucle de jeu, persistance
src/ui/        ← composants (blasons, chibis, cartes de salle, HUD…)
src/screens/   ← écrans (École, Boutique, Élèves, Maisons, Réglages, fiche de salle)
src/i18n/      ← textes FR (clés plates) + `t()` ; prêt pour l'anglais
scripts/       ← simulateur d'équilibrage
```

L'UI ne fait que **lire** l'état et appeler les actions du moteur (`levelUp`, `addSeat`…). Aucune règle de jeu n'est dans l'UI.

## Le système générique `Station` (§5 bis)

Accueil, Salon des Destinées, Grande Salle, Dortoirs et salles de cours sont tous des `Station` :
file + places (chacune avec un niveau 1→5) + niveau de salle + pistes d'aménagement.
Temps réel = `base × 0,96^(niv−1) × (1 − 0,05·(niveauPlace−1)) × (1 − min(confort·0,02 ; 0,5)) × (1 − Σ réductions des aménagements) × modifs de l'élève`, avec un plancher de 25 %.

## Décisions de gameplay

- **Marche purement visuelle** : dans la simulation les transitions sont instantanées ; à l'écran, les élèves marchent (90 px/s) vers leur place ou leur file. L'équilibrage n'en dépend pas.
- **Plan de l'école** (`src/data/layout.ts`) : grille de 5 × 4 parcelles, Accueil au coin avant près de la grille d'entrée. Les parcelles non construites affichent un panneau de chantier avec le prix.
- **Plafond de population** = 4 + 2 × lits + 0,5 × places de cours. Il oblige à acheter des dortoirs et des salles pour faire grandir l'école.
- **Priorités d'un élève libre** : fatigue ≥ 70 → dortoir ; sinon faim ≥ 60 → Grande Salle ; sinon cours. Choix du cours : meilleur `gain / (durée + attente estimée)` ± 15 % d'aléa.
- **Salon des Destinées** : un élève qui attend trop perd de l'humeur mais ne part pas. À l'**Accueil**, il part après 45 s (réputation −0,6).
- **Chapeau** : poids = 1 + affinité du trait, × rééquilibrage `(moyenne+1)/(effectif+1)`, ×4 pour la Maison choisie si le Chapeau est au niveau 5 ou plus.
- **Coupe des Maisons** : 10 points par cours validé, saison de 30 min de jeu. La Maison gagnante rapporte 15 Éclats par membre présent, plus 1 Gemme.
- **Faim ≥ 100** : cours 25 % plus lents et humeur −4 par cours. **Humeur < 30** : gains ×0,85.
- **Matières 4 à 9** : définies dans `courses.ts` mais verrouillées dans la Boutique jusqu'au J4 (système d'années). Voir `UNLOCKED_COURSES`.
- **Échec de cours** : 0 Éclat, 30 % de l'XP. Chaque niveau de place retire 2 points d'échec.

## Hors du périmètre pour l'instant

- Fournisseurs, professeurs, catalogue, durabilité (J5)
- Sprites, effets, cycle jour/nuit (J6)
- Réputation avancée, agrandissements, missions, succès, prestige (J7)
- Son (J8), tutoriel et build EAS (J9)
- Monétisation : rien n'est branché (§15).
