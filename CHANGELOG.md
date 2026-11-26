# Changelog

## 0.7.0 — Refonte visuelle des salles

- **Relief** : murs épais avec chapeau et corniche, sols surélevés avec tranche de pierre, ombres au pied des murs, ombres sous chaque objet, lumière des fenêtres au sol.
- **Textures** (SpriteCook) : parquet de chêne, dalles de pierre, tapis, murs en plâtre et pierre avec lambris, pelouse.
- **Salles de classe orientées** : tableau noir et bureau du professeur sur le mur de gauche, bureau tourné vers les élèves ; les élèves en cours sont vus de dos, face au tableau.
- **Beaucoup de décor** : fenêtres à rideaux, appliques, tableaux, bibliothèques, étagères à bocaux, tonneaux, caisses, globe, chandeliers, fauteuils, horloge, tableau d'affichage, chevalet, chat, hibou.
- **Portail** en fer forgé **à gauche**, au bout d'une allée pavée.
- **Objets légendaires plus sobres** : bois sombres, fer forgé, tissus profonds, sans effet doré.
- Fantôme dessiné pour l'événement « fantôme farceur ».

## 0.6.0 — Vrais graphismes et 10e matière

- **Sprites SpriteCook** (style « cosy » cartoon) : meubles de chaque matière, lits, comptoir de l'Accueil, tables de la Grande Salle, cheminée, bibliothèques, bureaux des professeurs, 8 élèves (2 par Maison, robe grise avant la répartition) et Méliandre.
- **Évolution des objets** : chaque place change d'aspect au niveau 3 (amélioré : laiton, argent, étincelles) puis au niveau 5 (légendaire : or, marbre, aura dorée), avec l'animation « ✨ Évolution ! ». Chaque niveau donne −5 % de temps et, sur les places de cours, +5 % d'Éclats. Bureaux, bibliothèques et tables évoluent avec le niveau de la salle.
- **10e matière : Duel** (5e année, arène de duel), professeur Delan Lanatre ; nouveau métier « Duelliste de renom » ; bonus Pyrraxe en Duel.
- Professeur·es nommé·es affiché·es dans les fiches de salle.

## 0.5.0 — Années, diplômes, événements et méta

- **J4** : 7 années, passage d'année avec bonus, cours avancés en 7e année, 9 matières constructibles.
- **Diplômes et métiers** originaux (Gardien·ne des Arcanes, Alchimiste, Oracle…), avec dons des anciens élèves. Nouvel écran « Anciens élèves ».
- Les élèves **marchent dans les couloirs et passent par les portes**. Les nouveaux arrivent par la grille d'entrée.
- **Événements** : banquet, étoiles filantes, fantôme farceur, hibou messager, inspection, explosion de chaudron, chute de balai, avec annonces et effets sur la carte.
- **Fiche élève** en touchant un élève sur la carte (année, progression, métier visé, besoins).
- **Réaménagement** des places dans la zone de chaque salle.
- **Coffres à récolter** (toucher le coffre, ou « Tout récolter ») et **managers** qui récoltent automatiquement.
- **Écran Rapport** : Éclats/min, rentabilité par salle, goulot, élèves par année, événements en cours.
- **Collection** de 16 reliques (4 collections) avec bonus permanents.
- **Cadeau du jour** sur 7 jours.
- **Nouvelle légende** (prestige) : repartir de zéro sous la mer, dans les nuages, en forêt ou sur la lune, avec un bonus permanent.
- Onglet « Plus » (Cadeau, Rapport, Collection, Anciens élèves, Nouvelle légende, Réglages).
- Sauvegarde v2 avec migration automatique.
- Professeur de Défense contre les Forces du Mal : Harvald.

## 0.4.0 — Vue isométrique

- L'école en coupe est remplacée par une **carte isométrique** (style « idle tycoon ») : salles ouvertes avec murs, sols, fenêtres, bannières et meubles propres à chaque matière ; couloirs en parquet, jardins, fontaine, grille d'entrée.
- Les élèves **marchent** jusqu'à leur place ou leur file, dorment dans les lits, et portent un chapeau pointu aux couleurs de leur Maison.
- Glisser pour se déplacer, pincer ou boutons +/− pour zoomer, toucher une salle pour ouvrir sa fiche.
- Parcelles vides avec panneau de chantier et prix : on les touche pour construire.
- Méliandre trône au centre du Salon des Destinées.

## 0.3.0 — J0 à J3

### J0 — Fondations

- Projet Expo SDK 58 + TypeScript strict, ESLint + Prettier, Jest, CI GitHub Actions (lint, type-check, tests avec couverture).
- Structure `src/{engine,data,state,ui,screens,i18n}`, `docs/DECISIONS.md`, thème de design.

### J1 — Moteur minimal

- Moteur déterministe à tick fixe (250 ms) : arrivées d'élèves, file de l'Accueil avec patience, salle de Potions, Éclats.
- Système générique `Station` (file + places + modificateurs) réutilisé partout.

### J2 — Boucle complète

- Dortoirs, lits, fatigue et sommeil ; Botanique et Histoire de la magie ; achat de salles et de dortoirs, niveaux de salle (1→10), places supplémentaires, amélioration place par place (1→5), aménagements (salle d'attente, parchemins automatiques, cheminée…).
- Sauvegarde automatique (toutes les 15 s et au passage en arrière-plan), versionnée avec migrations. Rattrapage hors-ligne (8 h max) et écran « Pendant votre absence… ».
- Bouton « Optimiser » (meilleur achat abordable pour chaque lieu).

### J3 — Les 4 Maisons

- Blasons SVG originaux (formes distinctes pour le daltonisme), Salon des Destinées avec Méliandre le Chapeau Songeur (22 répliques, bulle de blasons qui tournent), orientation de la répartition à partir du niveau 5.
- Grande Salle : faim, file, repas ; bonus passifs des Maisons ; Coupe des Maisons par saisons.
- Simulateur d'équilibrage `npm run simulate`.
