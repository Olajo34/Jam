# Jam — Beauté & Bien-être

Plateforme de réservation et paiement pour les professionnels de la beauté et du bien-être.

## Stack

- **Next.js 16** (App Router) · TypeScript
- **Tailwind CSS v4** avec tokens de marque Jam
- **Prisma 7** + PostgreSQL
- **NextAuth v5** — JWT, multi-rôles
- **Mobile Money** — CinetPay / NotchPay (MTN, Orange, Wave, Moov)

## Interfaces

| Route | Rôle | Accès |
|---|---|---|
| `/` | Public | Accueil, recherche |
| `/(user)/` | `USER` | Réservations, paiement |
| `/(prestataire)/` | `PRESTATAIRE` | Catalogue, agenda, abonnement |
| `/(moderateur)/` | `MODERATEUR` / `ADMIN` | Tickets, enrollment |
| `/(admin)/` | `ADMIN` | Dashboard global |

## Plans prestataires

| Plan | Prix | Réservations/mois |
|---|---|---|
| Free | 0 FCFA | 10 |
| Pro | 5 000 FCFA | 100 |
| Gold | 15 000 FCFA | Illimité + featured |

## Démarrage

```bash
# 1. Variables d'environnement
cp .env.example .env
# → Renseigner DATABASE_URL et AUTH_SECRET

# 2. Dépendances
npm install

# 3. Base de données
npx prisma migrate dev --name init

# 4. Lancer
npm run dev
```

## Structure

```
src/
├── app/
│   ├── (auth)/          → connexion, inscription
│   ├── (user)/          → grand public
│   ├── (prestataire)/   → espace prestataire
│   ├── (admin)/         → admin général
│   └── (moderateur)/    → admins fonctionnels
├── components/
│   └── ui/              → Button, Card, Input, Badge
└── lib/
    ├── auth.ts          → NextAuth config
    ├── prisma.ts        → client Prisma singleton
    └── utils.ts         → cn, formatFCFA, slugify…
```
