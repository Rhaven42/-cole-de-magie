# Équilibrage

Outil : `npm run simulate -- <heures> <graine>`. Résultats CSV écrits dans `balance-out/` (ignoré par git) :

- `per-minute.csv` : Éclats, Éclats/min, élèves/plafond, réputation, nombre d'achats, attente estimée à chaque lieu.
- `milestones.csv` : minute d'achat de chaque salle et de chaque dortoir.

Le bot suit `globalTarget()` (`src/engine/advisor.ts`) :

1. il achète la prochaine salle de cours débloquée dès qu'il peut ;
2. sinon, si un lieu fait attendre plus de 20 s, il achète l'amélioration la moins chère de ce lieu (place ou niveau ; un dortoir s'il ne reste plus de place) ;
3. sinon, il achète l'amélioration de cours la moins chère.

## Résultats (J3, 3 matières débloquées)

Graine 1, 3 h simulées :

| Minute | Éclats/min | Élèves (plafond) | Réputation | Goulot principal           |
| ------ | ---------- | ---------------- | ---------- | -------------------------- |
| 1      | 21         | 8 (14)           | 0,3        | Salon des Destinées (20 s) |
| 2      | 104        | 16 (16)          | 0,8        | Salon des Destinées (40 s) |
| 5      | 214        | 17 (20)          | 1,5        | Potions (15 s)             |
| 10     | 501        | 25 (25)          | 3,7        | —                          |
| 30     | 1 266      | 40 (40)          | 16,7       | Dortoirs (14 s)            |
| 60     | 2 199      | 46 (46)          | 46         | Dortoirs (14 s)            |

**Jalons** (objectifs §9) :

- 2e salle (Botanique) : **1,6 min** ✅ (objectif : moins de 2 min)
- 3e salle (Histoire de la magie) : **5,0 min** ✅ (objectif : 3 salles en moins de 15 min)
- 9 salles en environ 10 h : à caler au J4, quand les matières 4 à 9 et les années seront actives.

## Constats et pistes

- Au début, le **Salon des Destinées** (1 tabouret, 10 s) est le premier goulot : c'est voulu, il apprend au joueur à améliorer un lieu.
- Au bout d'une heure, les 3 salles sont au niveau 10 avec 12 places : l'argent s'accumule faute de choses à acheter. **Le J4 (6 matières de plus + années + diplômes) et le J5 (déco, professeurs) doivent absorber cette économie.** C'est attendu à ce stade.
- La population plafonne autour de 50 élèves, faute de départs. Les diplômes (J4) feront tourner les élèves.
