# Changelog

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
