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

## Mise à jour 0.5.0 — progression complète et méta

- **Années (J4)** : 8 → 20 cours validés par année (`src/data/progression.ts`). Passage d'année = bonus (25 × année). Les 7e années suivent des cours « Avancés » (gains ×2, durée ×1,5). Les 9 matières sont achetables ; seuls les élèves de l'année requise peuvent y aller.
- **Diplôme et métiers** : en fin de 7e année, l'élève quitte l'école (+600 Éclats, réputation +3, 30 % de chance de relique) et exerce le métier de la matière qu'il a le plus validée. Métiers **originaux** (pas de noms de licence) : Gardien·ne des Arcanes (Défense), Alchimiste, Herboriste, Archiviste des Mystères, Enchanteur·eresse, Cartographe des étoiles, Coursier·ère des nuées, Oracle, Métamorphiste. Les ancien·nes élèves envoient des **dons** réguliers selon leur métier.
- **Coffres et récolte** : les Éclats d'un cours tombent dans le coffre de la salle (capacité = récompense × (15 + 5 × niveau)). On touche le coffre (ou « Tout récolter ») pour encaisser. Coffre plein = Éclats perdus : c'est la « relance de production » des jeux idle.
- **Managers** (un par matière, noms originaux) : récoltent automatiquement (même hors-ligne), −5 % de durée. Prix = 1,5 × prix de la salle + 100.
- **Événements** : toutes les 2,5 à 5 min, un événement est tiré au sort (Banquet, Étoiles filantes, Fantôme farceur, Hibou messager, Inspection). Incidents : explosion de chaudron après un échec en Potions (salle fermée 10 s), chute de balai après un échec en Balais volants.
- **Déplacements** : les élèves suivent l'axe des couloirs et passent par la porte de chaque salle (milieu du mur avant droit). Le chemin est calculé par `route()` (`src/ui/iso.ts`, testé). Au plus 60 élèves sont dessinés à la fois ; la simulation, elle, gère tout le monde.
- **Réaménagement** : chaque place peut être déplacée dans la zone de sa salle (de 0,9 à 7,1 tuiles, 0,95 d'écart minimum) depuis la fiche de la salle. Les places déplacées gardent leur position et la salle reste dans sa zone d'origine.
- **Collection** : 16 reliques réparties en 4 collections. Chaque relique donne +1 % d'Éclats, chaque collection complète +5 %.
- **Cadeau du jour** : cycle de 7 jours consécutifs. Une série cassée fait repartir au jour 1. Le 7e jour donne des Gemmes et une relique.
- **Prestige — « Nouvelle légende »** : à partir de 40 diplômé·es (+15 par reconstruction), on repart de zéro dans l'environnement suivant : Vieux Manoir → Académie des Abysses (sous-marine) → Citadelle des Nuages → Forêt profonde → Observatoire lunaire. On garde les Gemmes (+10), les reliques et le cadeau du jour, et on gagne +25 % d'Éclats permanents par niveau.
- **Sauvegarde v2** : la migration v1 → v2 ajoute les nouveaux champs ; une ancienne partie se charge sans perte.
- **Professeur·es nommé·es** (`src/data/professors.ts`, affichés dans la fiche de la salle) : Défense → Harvald ; Sortilèges → Taladon Morvard ; Métamorphose → Tenarius D’Arvay ; Potions → Dolohov ; Botanique → Solomon Tregahl ; Balais volants → Alva (professeure) ; Divination → à venir. Ils et elles seront les titulaires au J5.

## Mise à jour 0.6.0

- **Graphismes** : sprites SpriteCook découpés localement depuis des planches (4 planches de meubles, 1 planche de personnages), soit environ 80 crédits sur 1 000. Le reste est réservé aux portraits des professeur·es, d'après les descriptions physiques qui seront fournies. Les sprites sont réduits à 160 px maximum.
- **Évolution des objets** : paliers visuels aux niveaux de place 3 et 5 (`ECONOMY.seatTiers`), +5 % d'Éclats par niveau de place sur les cours (`seatUpgrade.coinPerLevel`).
- **10e matière « Duel »** (`duel`) : 3 arènes, 55 s, 52 Éclats, 5e année, 300 000 Éclats ; elle prend la parcelle (1,0), l'ancien jardin.
