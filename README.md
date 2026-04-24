# Saad Letter

Jeu de cartes inspiré de **Love Letter** (2ᵉ édition Z-Man 2019, avec Espionne + Chancelière), multijoueur temps réel, jouable depuis navigateur mobile et desktop.

- **Mode solo vs bots** fonctionnel sans configuration externe.
- **Mode online** (créer/rejoindre une salle) disponible une fois Pusher + Upstash configurés.

## Stack

- **Frontend** : Next.js 16 (App Router) + TypeScript strict + Tailwind 4
- **Animations** : motion (framer-motion v12)
- **Realtime** : Pusher Channels
- **État persisté** : Upstash Redis (REST)
- **Hébergement** : Vercel
- **Tests** : Vitest (moteur pur, 38 tests)

Règles officielles : [docs/rules.md](docs/rules.md).

## Développement local

```bash
pnpm install
pnpm dev
```

Ouvrir http://localhost:3000. Le mode **solo vs bots** marche immédiatement.

## Tests

```bash
pnpm test            # run
pnpm test:watch      # watch
pnpm test:coverage   # coverage sur lib/game/
```

## Structure

- `app/` — routes Next.js
  - `page.tsx` — landing
  - `play/solo/` — solo vs bots
  - `play/online/` — lobby online (créer/rejoindre)
  - `play/[code]/` — salle en ligne + partie
  - `api/rooms/`, `api/pusher/auth/` — backend online
- `lib/game/` — moteur de jeu pur (pas de dépendance UI/réseau)
- `lib/game/bot.ts` — IA heuristique pour le solo
- `lib/game/views.ts` — filtre serveur (masque mains adverses)
- `lib/store/` — persistance Upstash Redis (rooms)
- `lib/realtime/` — wrappers Pusher (server + client)
- `lib/online/client.ts` — helpers fetch pour le lobby
- `components/game/` — composants UI du jeu (Card, GameTable, PlayerSeat, RevealBubble…)
- `components/ui/` — primitives (Modal, Button)
- `tests/game/` — tests Vitest
- `docs/` — règles, direction visuelle, prompts d'illustrations
- `scripts/split-cards-sheet.mjs` — outil de découpe du composite

## Activer le mode online

Le mode online nécessite un compte Pusher (free tier Sandbox) et un compte Upstash (free tier).

### 1. Créer un projet Pusher

1. Inscription sur https://dashboard.pusher.com/accounts/sign_up.
2. Créer une app **Channels** → choisir un cluster (ex : `eu` pour l'Europe).
3. Noter dans l'onglet **App Keys** : `app_id`, `key`, `secret`, `cluster`.

### 2. Créer une base Upstash Redis

1. Inscription sur https://console.upstash.com.
2. **Create database** → type **Redis** → **Global** (ou EU selon ta zone).
3. Dans l'onglet **REST API**, noter `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN`.

### 3. Variables d'environnement

Copier `.env.example` en `.env.local` et remplir :

| Variable | Valeur |
|---|---|
| `PUSHER_APP_ID` | app_id Pusher |
| `PUSHER_KEY` | key Pusher |
| `PUSHER_SECRET` | secret Pusher (serveur uniquement) |
| `PUSHER_CLUSTER` | ex `eu` |
| `NEXT_PUBLIC_PUSHER_KEY` | même valeur que `PUSHER_KEY` |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | même valeur que `PUSHER_CLUSTER` |
| `UPSTASH_REDIS_REST_URL` | URL REST Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | token Upstash |

Redémarrer `pnpm dev`. Les boutons **Jouer en ligne avec des amis** deviennent fonctionnels.

## Déploiement Vercel

### Première fois

```bash
# 1. Push sur GitHub
gh auth login            # browser auth, une fois
gh repo create saad-letter --public --source=. --remote=origin --push

# 2. Import sur Vercel
# → https://vercel.com/new → Import from GitHub → sélectionner le repo
# Preset détecté : Next.js. Cliquer Deploy (sans env vars au début, le solo marche).
```

### Ajouter les env vars Vercel (pour activer le multi)

Dans le dashboard Vercel → Project → **Settings** → **Environment Variables** :
- Ajouter les 8 variables listées plus haut.
- Cocher `Production` + `Preview`.
- Redéployer (`vercel --prod` ou push un commit).

### Domaine

Par défaut Vercel attribue `https://saad-letter.vercel.app`. Custom domain : Vercel → Settings → Domains.

## Découper de nouvelles illustrations

Si tu régénères le composite `cards-sheet.png` (avec Baron et Comtesse cette fois, et le Roi à la bonne valeur 7) :

```bash
# Enregistrer l'image à c:\Users\Love Letter\cards-sheet.png
node scripts/split-cards-sheet.mjs
```

Voir [docs/illustration-prompts.md](docs/illustration-prompts.md) pour les prompts Midjourney/DALL-E par carte.

Baron (3) et Comtesse (8) sont absents du composite v1 — ils affichent une silhouette SVG en fallback tant qu'elles ne sont pas ajoutées.
