# 🐔 La Poule qui Traverse — Projet JS/TS
Jeu simple où une poule traverse des voies avec des voitures. Flèches du clavier pour bouger.

## Lancer
```bash
npm install
npm run dev
```

## Points techniques (conformité aux consignes)
- **ES6+** : `let/const`, flèches, template literals, destructuration, spread, **modules**.
- **Closures** : compteur de score encapsulé dans `core/state.ts`.
- **this, call/apply/bind** : boucle de jeu liée avec `bind`, démonstration de `.call` via `utils/callWith` utilisée au démarrage.
- **DOM/Événements** : écoute des touches, bouton Start, MAJ du HUD.
- **Styles dynamiques** : petites surbrillances, HUD mis à jour via JS.
- **Animations** : `requestAnimationFrame` + clignotement `flash()`.
- **Asynchronisme** : chargement `levels.json` avec `async/await`, `try/catch`, `Promise.race` + abort.
- **TypeScript** : plusieurs **interfaces** (`Player`, `Car`, `LevelConfig`, `GameConfig`), **union type** (`1 | -1`), **optional chaining** dans la gestion d'erreurs.
- **Architecture** : séparation `src/core/` (mécanique), `src/utils/` (helpers), `src/main.ts` (bootstrap), `public/` (données).
