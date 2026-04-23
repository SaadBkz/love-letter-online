# Love Letter Online

Jeu de cartes **Love Letter** (2ᵉ édition Z-Man 2019, avec Espionne + Chancelière) multijoueur temps réel, jouable depuis navigateur mobile et desktop.

## Stack

- **Frontend** : Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- **Realtime** : Pusher Channels
- **État de partie** : Upstash Redis (REST)
- **Hébergement** : Vercel
- **Tests** : Vitest (moteur pur)

Règles officielles : [docs/rules.md](docs/rules.md).

## Développement

```bash
pnpm install
pnpm dev
```

Ouvrir http://localhost:3000

## Tests

```bash
pnpm test            # run
pnpm test:watch      # watch
pnpm test:coverage   # coverage sur lib/game/
```

## Structure

- `app/` — routes Next.js (App Router)
- `lib/game/` — moteur de jeu pur, aucune dépendance UI/réseau
- `lib/realtime/` — wrapper Pusher (client + serveur)
- `lib/store/` — persistance Upstash Redis
- `lib/validation/` — schémas Zod
- `components/` — UI React
- `tests/game/` — tests Vitest du moteur
- `docs/` — règles du jeu
