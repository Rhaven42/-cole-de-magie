# Arcanum Academy 🏰✨

Jeu mobile de gestion d'une école de magie (Android & iOS, portrait). Expo + React Native + TypeScript.

## Lancer le jeu sur votre téléphone

1. Installez **Expo Go** sur le téléphone (App Store / Play Store).
2. Sur l'ordinateur (Node 22 ou plus) :
   ```bash
   npm install
   npx expo start
   ```
3. Scannez le QR code : avec l'appareil photo sur iPhone, depuis Expo Go sur Android.
   Si le téléphone n'est pas sur le même Wi-Fi que l'ordinateur : `npx expo start --tunnel`.

Version web (pour tester rapidement) : `npx expo start --web`.

## Commandes

| Commande                          | Rôle                                                              |
| --------------------------------- | ----------------------------------------------------------------- |
| `npm test`                        | Tests du moteur (Jest)                                            |
| `npm run test:coverage`           | Tests + couverture (seuil 80 %)                                   |
| `npm run typecheck`               | Vérification TypeScript                                           |
| `npm run lint` / `npm run format` | ESLint / Prettier                                                 |
| `npm run simulate -- 3 1`         | Simule 3 h de jeu (graine 1) avec un bot, CSV dans `balance-out/` |

## Rééquilibrer le jeu

Tout se trouve dans **`src/data/`** : `courses.ts` (matières), `houses.ts` (Maisons, Coupe), `stations.ts` (Accueil, Salon, Grande Salle, dortoirs), `economy.ts` (coûts, population, besoins), `formulas.ts`. Après une modification, relancez `npm run simulate` et comparez avec `docs/BALANCE.md`.

## Construire l'application (plus tard, J9)

```bash
npx eas-cli@latest build -p android --profile preview
```

Il faut un compte Expo (gratuit), plus un compte Apple Developer pour iOS.

## Documentation

- `docs/DECISIONS.md` : choix techniques et règles de jeu
- `docs/BALANCE.md` : résultats d'équilibrage
- `docs/STYLE_GUIDE.md` : bible de style
- `CHANGELOG.md`
