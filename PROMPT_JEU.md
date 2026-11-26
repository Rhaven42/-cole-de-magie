# PROMPT MAÎTRE — « Arcanum Academy » (jeu mobile de gestion d'école de magie)

> Copie tout ce qui suit dans Claude Code (ou toute autre IA de dev) pour lancer la création du jeu.

---

## 0. RÔLE ET MÉTHODE DE TRAVAIL

Tu es un **lead game developer + game designer + directeur artistique** expérimenté en jeux mobiles de gestion / idle-tycoon (références d'ambiance de gameplay : *Hay Day*, *Game Dev Tycoon*, *Kairosoft*, *Idle Theme Park*).
Tu vas créer **de A à Z** un jeu mobile jouable, propre, équilibré, dans ce dépôt Git.

Règles de travail :
1. **Ne me pose pas 50 questions.** Prends des décisions raisonnables, note-les dans `docs/DECISIONS.md`, et avance. Pose uniquement les questions bloquantes (compte développeur, clé API, etc.).
2. **Travaille par jalons** (section 12). À la fin de chaque jalon : le jeu doit se lancer, les tests passent, tu commits et tu me résumes en 5 lignes ce qui est jouable.
3. **Tu as mon autorisation** pour installer tous les logiciels, paquets, CLI et outils nécessaires (Node, Expo, outils de build, générateurs d'assets, etc.). Préviens-moi seulement pour ce qui coûte de l'argent ou nécessite un compte personnel.
4. **Toute la logique d'économie est pilotée par des données** (fichiers JSON/TS de config), jamais codée en dur dans l'UI : je dois pouvoir rééquilibrer le jeu en modifiant un seul dossier `src/data/`.
5. Interface et textes du jeu **en français** (système i18n prêt pour ajouter l'anglais ensuite).
6. **Originalité obligatoire** : aucun nom, logo, lieu ou personnage issu de Harry Potter ou d'une autre licence. Univers magique original.

---

## 1. CONCEPT

**Arcanum Academy** : le joueur est le/la directeur·rice d'une école de magie qui démarre dans un vieux manoir délabré. Des élèves arrivent en file d'attente, s'inscrivent à l'**Accueil**, sont répartis dans une **Maison**, suivent des **cours** dans des salles, **dorment** dans des dortoirs pour récupérer, et chaque cours validé rapporte des **pièces d'or** (« Éclats ») que le joueur réinvestit pour agrandir l'école, acheter des salles, améliorer les équipements, la décoration, etc.

**Boucle principale (core loop)** :
`Élève arrive → file d'attente → inscription à l'Accueil → choisit un cours accessible selon son année → attend une place → suit le cours (temps d'apprentissage) → cours validé = pièces + XP → fatigue → va dormir (temps de repos/cooldown) → repart en cours … → monte d'année → débloque de nouveaux cours`

Le plaisir vient de : **résoudre les goulots d'étranglement** (file trop longue, pas assez de lits, salle saturée), optimiser, voir l'école grandir, et collectionner/décorer.

**Plateformes** : Android et iOS, **portrait**, jouable à une main. Mode hors-ligne complet.

---

## 2. STACK TECHNIQUE (décision par défaut, modifiable si tu justifies mieux)

- **React Native + Expo (SDK récent) + TypeScript strict**, testable sur mon téléphone via Expo Go, puis build via EAS.
- **Rendu de l'école** : vue 2D isométrique ou « coupe de maison » (cutaway, comme un manoir ouvert vu de face avec étages) avec `@shopify/react-native-skia` ou `react-native-reanimated` + sprites. Choisis ce qui donne le meilleur rendu à 60 fps sur téléphone milieu de gamme.
- **État** : Zustand (ou équivalent) avec persistance locale (`MMKV` / `AsyncStorage`).
- **Moteur de simulation** séparé de l'UI (`src/engine/`) : pur TypeScript, déterministe, **testé avec Jest** (tests unitaires obligatoires sur la file d'attente, le calcul des temps, l'économie, le hors-ligne).
- **Boucle de jeu** à pas de temps fixe (tick 250 ms) + rattrapage du temps écoulé quand l'app était fermée (voir §10).
- Architecture : `src/engine`, `src/data`, `src/ui`, `src/screens`, `src/assets`, `src/i18n`, `docs/`.
- Lint + format (ESLint, Prettier), CI GitHub Actions (lint + tests + type-check).

---

## 3. LES 4 MAISONS (identité visuelle imposée)

Chaque élève appartient à une Maison, attribuée à l'inscription (aléatoire pondéré, ou via un petit « Choixpeau-like » original : un **Miroir des Âmes** animé). Chaque Maison a un **blason** (écusson vectoriel original), une couleur, un trait de personnalité et un **petit bonus passif** :

| Maison | Couleur du blason | Emblème | Trait | Bonus passif (à équilibrer) |
|---|---|---|---|---|
| **Pyrraxe** | 🔴 ROUGE | Phénix stylisé | Courageux, impulsif | Élèves −8 % de temps d'apprentissage en Défense contre les Forces du Mal et Balais volants |
| **Sylvaine** | 🟢 VERT | Cerf à ramure de feuilles | Ambitieux, rusé | +8 % de pièces gagnées par cours validé (le tout-venant est plus rentable) |
| **Aurélis** | 🟡 JAUNE | Soleil à abeille | Loyal, travailleur | Fatigue −10 % (dorment moins souvent) |
| **Azuréa** | 🔵 BLEU | Hippocampe | Curieux, érudit | −8 % de temps en Histoire de la magie, Divination, Astronomie ; +XP |

Exigences :
- Les 4 blasons sont visibles sur : l'écran d'inscription, la fiche élève, les bannières dans l'école, un **classement des Maisons** (Coupe des Maisons : points gagnés par cours validés, remise à zéro par saison).
- Palette stricte : rouge `#C0392B`, vert `#1E8449`, jaune `#F4C430`, bleu `#2471A3`. Chaque blason doit rester lisible en petit (icône 32 px).

---

## 4. ÉLÈVES

Chaque élève est un objet avec : `id`, nom généré (prénoms + noms de famille originaux), apparence (génération procédurale : peau, cheveux, uniforme aux couleurs de la Maison), `maison`, `année` (1 à 7), `ancienneté` (nb de cours validés / temps passé à l'école), `XP`, `fatigue` (0–100), `humeur` (0–100), `traits` (1 trait mineur : *Studieux* +XP, *Dormeur* fatigue +, *Fêtard* humeur −, *Distrait* temps +…), état courant (en file, en inscription, en route, en cours, au lit, en pause).

**États & cycle** : `ARRIVE → FILE_ACCUEIL → INSCRIPTION → LIBRE → VA_EN_COURS → EN_COURS → COURS_VALIDÉ → (fatigue ≥ seuil) → FILE_DORTOIR → DORT (cooldown) → LIBRE`.

**Niveau d'ancienneté / accès aux cours** :
- Année 1 : Potions (base), Botanique, Histoire de la magie.
- Année 2 : + Sortilèges, Astronomie.
- Année 3 : + Balais volants.
- Année 4 : + Divination.
- Année 5 : + Métamorphose.
- Année 6 : + Défense contre les Forces du Mal.
- Année 7 : accès à tout + cours « Avancé » (version ×2 récompense, ×1.5 durée).
- Un élève passe à l'année suivante après N cours validés (config, ex. 8 → 12 → 16…). Une **cérémonie de passage** (petite animation + bonus de pièces) est déclenchée.
- Un élève qui termine l'année 7 **est diplômé** : il quitte l'école en donnant un gros bonus de pièces + **points de Prestige/Réputation** (la réputation augmente le flux d'élèves entrants).

Un élève ne peut aller qu'aux cours auxquels son année donne accès ; l'IA de choix de cours privilégie le cours accessible avec le moins de file / le plus rentable pour l'école selon un petit score (config).

---

## 5. SALLES / COURS (9 matières)

Chaque salle est **achetable** (prix croissant), **améliorable** (niveaux 1→10) et possède :
- **Nombre de places** (sièges / chaudrons / balais / télescopes…)
- **Temps d'apprentissage** (durée d'un cours)
- **Pièces par cours validé**
- **Taux d'échec / bonus de réussite** (un cours raté = 0 pièce mais un peu d'XP)
- **Décoration de salle** (réduit le temps d'apprentissage, voir §7)
- Un **prérequis d'année** (§4)

| # | Cours | Places de départ | Durée de base | Récompense de base | Année min. | Particularité |
|---|---|---|---|---|---|---|
| 1 | **Potions** | 4 chaudrons | 20 s | 10 | 1 | Peut « rater » (explosion visuelle) sans bon matériel |
| 2 | **Botanique** | 5 plants | 25 s | 12 | 1 | Les plantes peuvent donner un bonus passif d'ingrédients |
| 3 | **Histoire de la magie** | 8 pupitres | 30 s | 14 | 1 | Beaucoup de places, risque d'endormissement (fatigue +) |
| 4 | **Sortilèges** | 5 estrades | 35 s | 22 | 2 | Cours « polyvalent » rentable |
| 5 | **Astronomie** | 4 télescopes | 40 s | 26 | 2 | Bonus de nuit (cycle jour/nuit) |
| 6 | **Balais volants** | 3 balais | 45 s | 35 | 3 | Salle en extérieur, risque de chute (fatigue +) |
| 7 | **Divination** | 4 boules de cristal | 50 s | 42 | 4 | Événements aléatoires (prédictions = mini-bonus) |
| 8 | **Métamorphose** | 3 podiums | 60 s | 60 | 5 | Cher, lent, très rentable |
| 9 | **Défense contre les Forces du Mal** | 3 cercles | 75 s | 90 | 6 | Le plus rentable ; consomme de la fatigue |

(Valeurs de départ à ajuster avec le simulateur d'équilibrage, §11.)

**Améliorations de salle** (chaque niveau coûte `base × 1.55^niveau`) :
- Niveau → +1 place tous les 2 niveaux, −4 % de temps d'apprentissage par niveau, +6 % de pièces par niveau.
- Paliers de milestone (niv. 5 et 10) : bonus spéciaux (ex. Potions niv. 5 : taux d'échec 0).

Chaque salle a un visuel qui **évolue** visiblement avec ses niveaux (3 paliers d'aspect : modeste / confortable / prestigieuse).

---

## 6. ACCUEIL (inscription) ⭐ INDISPENSABLE

- Une pièce **Accueil / Secrétariat** : c'est la **porte d'entrée** du jeu.
- Les élèves arrivent par la grille d'entrée à une cadence qui dépend de la **Réputation** de l'école.
- Ils forment une **file d'attente visible** devant le comptoir.
- Le comptoir a un nombre de **guichets** (1 au départ). Un élève met un certain temps à s'inscrire (durée d'inscription, ex. 8 s).
- **Améliorations de l'Accueil** : +1 guichet, comptoir plus rapide (−% de temps d'inscription), **parchemins d'inscription automatiques**, salle d'attente confortable (les élèves en file ont une **patience** plus grande : sinon ils repartent → perte de réputation), bureau de tri (Miroir des Âmes animé, plus rapide).
- Un élève qui perd patience dans la file s'en va (visuel : bulle rouge, pas de pièces). Un élève satisfait augmente légèrement la Réputation.
- Afficher une **jauge de file** (longueur, temps moyen d'attente) lisible d'un coup d'œil.

---

## 7. DORTOIRS, LITS, DÉCORATION (le cœur de la gestion du « cooldown »)

Les élèves accumulent de la **fatigue**. Quand elle dépasse un seuil, ils doivent **dormir** (c'est leur *cooldown* : un élève au lit ne suit pas de cours).

**Objectif du joueur** : réduire le temps de sommeil nécessaire et fluidifier la file des dortoirs pour que les élèves reviennent plus vite en cours.

Mécaniques :
- **Dortoirs** : on peut acheter des **dortoirs supplémentaires** (chacun a une capacité de lits max et un thème de Maison optionnel ; dormir dans le dortoir de sa Maison donne un petit bonus).
- **Lits** : achat de lits supplémentaires (+ places de sommeil simultanées = moins d'attente au dortoir).
- **Qualité des lits** (améliorables) : réduit la durée de sommeil.
- **Décoration** (tapis, rideaux, bougies, lampes, plantes apaisantes, cheminée…) : réduit encore le temps de sommeil (cooldown) via un **score de Confort**.
- Même logique de **Confort / Décoration** dans **toutes** les salles (réduit le temps d'apprentissage et/ou augmente la satisfaction), mais avec des effets propres à chaque matière.

Formule de départ (à garder dans `src/data/formulas.ts`) :
`tempsSommeil = baseSommeil × (1 − qualitéLit) × (1 − min(confort × 0,02, 0,5)) × malusTrait`
(plafonner les réductions cumulées pour éviter un jeu cassé : jamais en dessous de 25 % du temps de base).

---

## 8. FOURNISSEURS ET PRODUITS (choix avec compromis) ⭐

Chaque achat de **lit, décoration, matériel de classe** se fait via un **catalogue de fournisseurs** aux prix, qualités et défauts différents. Le joueur doit **choisir** (pas de meilleure option unique). Exemple de 4 fournisseurs originaux :

| Fournisseur | Prix | Points forts | Défauts |
|---|---|---|---|
| **Brocante de Maître Gribouille** | € (très bas) | Bon marché, livraison immédiate | Qualité faible, **usure rapide** (le produit perd un niveau de qualité après un certain temps → il faut le réparer) |
| **Ateliers Ébène & Fils** | €€ | Bon équilibre, durable | Pas de bonus spécial, stock limité (délai de livraison) |
| **Maison Lumi-Fée** | €€€ | Très gros bonus de Confort/Décoration | Fragile (coût de réparation élevé), consomme de l'énergie magique (coût d'entretien par minute) |
| **Manufacture Royale d'Arcane** | €€€€ | Meilleur rendement, indestructible, bonus de Maison | Très cher, **long délai de livraison** (timer), exige une salle d'un certain niveau |

Chaque produit possède : `prix`, `qualité (1–5)`, `bonus principal`, `défaut`, `durabilité`, `coût d'entretien`, `délai de livraison`, `prérequis`. Un **comparateur** (écran avec 2-3 produits côte à côte, flèches ▲▼ vert/rouge) aide à choisir.
Prévoir 3 catégories au minimum : **Lits**, **Décoration**, **Matériel de salle** (chaudrons, balais, télescopes, etc.).
Chaque fournisseur a une **réputation / niveau de fidélité** : plus on lui achète, plus il débloque de remises ou de produits.

---

## 9. ÉCONOMIE & PROGRESSION

- **Monnaie principale** : les **Éclats d'or** (gagnés à chaque cours validé).
- **Monnaie secondaire** : **Gemmes d'Arcane** (rares : cérémonies de diplôme, succès, événements, option de récompense pub) → permettent d'accélérer une livraison, de réparer instantanément, d'acheter un décor exclusif. **Aucun pay-to-win agressif.**
- **Réputation de l'école** (étoiles 1→5+) : augmente la cadence d'arrivée des élèves, débloque de nouveaux fournisseurs et de nouveaux terrains d'agrandissement.
- **Agrandissements** : achat de nouveaux **terrains / étages / ailes** pour construire de nouvelles salles et dortoirs (grille de construction).
- **Prestige** (méta-progression longue durée) : « Reconstruire la légende » → remise à zéro partielle contre un bonus permanent (ex. +x % de pièces).
- **Missions du jour et succès** (« 50 potions réussies », « 0 élève parti en 1 journée »).
- **Événements saisonniers** (Nuit des étoiles filantes, Tournoi des Maisons) : modificateurs temporaires, décors limités.
- Courbe de coûts en `base × croissance^niveau` avec table d'équilibrage dans `src/data/economy.ts`. Objectif de rythme : **première salle achetée en < 2 min, 3 premières salles en < 15 min, 9 salles en ~10 h de jeu actif**, avec une progression idle satisfaisante.

---

## 10. RÈGLES TECHNIQUES DE SIMULATION

- Tick fixe 250 ms, simulation indépendante du framerate.
- **Progression hors-ligne** : au retour, calculer les cours/sommeils terminés pendant l'absence (jusqu'à 8 h, +12 h avec une amélioration), afficher un écran **« Pendant votre absence… »** (pièces, élèves diplômés, événements).
- Sauvegarde automatique toutes les 15 s + à la mise en arrière-plan, **versionnée** (migration de schéma pour ne jamais casser une sauvegarde).
- Aucune logique dupliquée entre UI et moteur ; l'UI **lit** l'état, le moteur le **modifie**.
- Gestion des **pics d'élèves** : max d'agents à l'écran configurable (ex. 60), au-delà → rendu simplifié mais simulation intacte.
- Anti-triche léger (horloge système) pour l'hors-ligne.

---

## 11. OUTIL D'ÉQUILIBRAGE (à livrer)

Crée un script `npm run simulate` qui simule N heures de jeu avec un « joueur bot » (stratégie : acheter l'amélioration au meilleur ROI) et sort des tableaux CSV : pièces/min, temps pour acheter chaque salle, goulots (file Accueil, file dortoir, file par salle). Utilise-le pour caler les valeurs des §5–§9 **avant** de me présenter le jeu. Documente les résultats dans `docs/BALANCE.md`.

---

## 12. JALONS (livre-les dans cet ordre)

1. **J0 — Fondations** : projet Expo + TS, lint, tests, CI, structure de dossiers, `docs/DECISIONS.md`, thème de design (couleurs, typos).
2. **J1 — Moteur minimal** : élèves, file d'Accueil, 1 salle (Potions), pièces, tests Jest. Visible en vue debug.
3. **J2 — Boucle complète** : Dortoir + lits + fatigue/sommeil, 3 premières matières (Potions, Botanique, Histoire de la magie), achat/amélioration, sauvegarde.
4. **J3 — Les 4 Maisons** : blasons, attribution, bonus passifs, Coupe des Maisons.
5. **J4 — Les 9 cours** + système d'années / ancienneté / diplôme.
6. **J5 — Fournisseurs & catalogue** : lits, décos, matériel, comparateur, durabilité/réparation, délais de livraison.
7. **J6 — Direction artistique complète** : rendu de l'école, sprites élèves animés, effets (potion qui explose, balai qui vole), UI soignée.
8. **J7 — Méta** : Réputation, agrandissements, hors-ligne, missions, succès, prestige.
9. **J8 — Son & musique** : musique d'ambiance par pièce, SFX (clic, pièces, validation de cours, ronflements 😴).
10. **J9 — Polish & tutoriel** : tutoriel guidé en 6 étapes, accessibilité (daltonisme : les Maisons doivent aussi se distinguer par leur **forme d'emblème**, pas seulement la couleur), réglages, performances, build Android/iOS (EAS).

---

## 13. DIRECTION ARTISTIQUE

- Style : **cartoon chaleureux et cosy**, « manoir de conte de fées », contours doux, palette riche (bois chaud, parchemin, lueurs de bougies), lumière dorée.
- Vue en **coupe de manoir** à plusieurs étages défilables (swipe vertical/horizontal, pinch-zoom).
- Personnages **chibi** (grosse tête, lisibles), animations simples (marche, assis, écrit, dort avec des « Zzz », lévite).
- UI : gros boutons tactiles (≥ 48 dp), boutons « Acheter » et « Améliorer » toujours au pouce, pastilles de notification sur les salles qui ont besoin d'attention (file trop longue, produit usé).
- **Génération d'assets** : tu as accès à des outils de génération d'images/sprites (ex. SpriteCook via MCP) et de sons/voix (ElevenLabs). Utilise-les pour produire sprites, icônes, blasons et sons ; garde une **bible de style** (`docs/STYLE_GUIDE.md`) et réutilise les mêmes références pour garder une cohérence. Sinon, commence avec des placeholders propres et remplace-les au fil des jalons.

---

## 14. UX / ÉCRANS

1. **Écran principal** : l'école en coupe, bandeau haut (Éclats, Gemmes, Réputation ⭐, élèves présents), bandeau bas (Boutique, Élèves, Missions, Maisons, Réglages).
2. **Écran Boutique** : onglets *Salles · Dortoirs · Lits · Décoration · Matériel*, avec filtre par fournisseur et comparateur.
3. **Fiche salle** : stats (places, durée, gains), niveaux, bouton améliorer, produits installés, usure.
4. **Fiche élève** : blason, année, ancienneté, fatigue, humeur, traits, historique.
5. **Accueil** : file visible, guichets, améliorations, jauge de patience.
6. **Coupe des Maisons** : classement animé avec les 4 blasons.
7. **Écran « Pendant votre absence »**, **Succès**, **Missions**, **Réglages** (son, langue, vibrations, sauvegarde cloud plus tard).

Feedback constant : textes flottants « +12 💰 », vibration légère, particules lors d'un cours validé, son satisfaisant. **Tout achat doit donner une sensation de récompense.**

---

## 15. MONÉTISATION (optionnelle, désactivée par défaut)

Prévoir l'architecture (feature flags) pour : pubs récompensées (boost ×2 de pièces 5 min), pass de saison cosmétique, packs de Gemmes. **Jamais de mur payant** sur la progression principale. Ne rien brancher sans mon accord.

---

## 16. QUALITÉ & DÉFINITION DE « TERMINÉ »

- ✅ Le jeu démarre sur mon téléphone via Expo Go sans erreur.
- ✅ Les 9 cours, 4 Maisons, Accueil, dortoirs, lits, déco, fournisseurs sont jouables.
- ✅ Tests unitaires du moteur ≥ 80 % de couverture ; lint et type-check sans erreur.
- ✅ 60 fps sur un téléphone milieu de gamme avec 40 élèves à l'écran.
- ✅ Sauvegarde / chargement / hors-ligne fiables.
- ✅ `README.md` : comment lancer, tester, équilibrer et construire l'app.
- ✅ À chaque jalon, commits clairs sur la branche de travail, mise à jour du `CHANGELOG.md`.

---

## 17. ACTIONS IMMÉDIATES

1. Lis ce prompt en entier, crée `docs/DECISIONS.md` avec tes choix techniques.
2. Initialise le projet (J0), installe ce qui est nécessaire (autorisation donnée).
3. Livre le **J1** et montre-moi comment le lancer sur mon téléphone.
4. Enchaîne les jalons jusqu'au J3 sans m'attendre, puis fais-moi un point.

**Commence maintenant.**
