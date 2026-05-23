# 🏠 Mon Foyer

Application famille tout-en-un pour José, Anaïs et Lucas.

## Fonctionnalités

- **Budget** — 2 comptes (LCL, SG/BFM), transactions validées/en attente, bloc locatif, import CSV, graphiques
- **Agenda** — Grille mensuelle, événements par membre, export .ics, lien Google Calendar
- **Courses** — Liste par rayon, cocher/décocher, vider les cochés
- **Tâches** — To-do par membre et priorité, dates limites
- **Chat** — 4 salons en temps réel (WebSocket), actions rapides, historique
- **PWA** — Installable sur mobile, notifications push

## Prérequis

- Node.js >= 18
- npm >= 9

## Installation

```bash
cd mon-foyer
npm install
```

## Démarrage (développement)

```bash
# Terminal 1 — initialiser la base de données avec les données démo
npm run seed

# Terminal 2 — démarrer serveur + client en parallèle
npm run dev
```

- Client : http://localhost:5173
- Serveur API : http://localhost:3001

## Production

```bash
npm run build
npm start
```

L'application sera servie sur http://localhost:3001

## Structure

```
mon-foyer/
├── client/               # React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/        # Pages principales
│   │   ├── components/   # Composants réutilisables
│   │   ├── hooks/        # Hooks custom (WebSocket, notifications)
│   │   ├── types/        # Types TypeScript
│   │   └── utils/        # API client, parseur CSV
│   └── public/           # Assets statiques, manifest PWA
└── server/               # Node.js + Express
    └── src/
        ├── db/           # Schema SQLite + Drizzle ORM + seed
        ├── routes/       # Endpoints REST
        └── websocket.ts  # Serveur WebSocket (chat temps réel)
```

## Membres

| Membre | Couleur   | Emoji |
|--------|-----------|-------|
| José   | `#378ADD` | 👨    |
| Anaïs  | `#D4537E` | 👩    |
| Lucas  | `#639922` | 🧒    |

## Format CSV pour import

```csv
date;compte;libelle;debit;credit
15/05/2026;LCL;Salaire CAP VIDEO;0;2160.05
01/05/2026;LCL;Loyer résidence;850;0
```

## Catégorisation automatique

| Libellé (regex)              | Catégorie     |
|------------------------------|---------------|
| `CAP VIDEO`                  | Salaires      |
| `CIP GESTION`                | CIP Gestion   |
| `SPOTIFY`                    | Abonnements   |
| `BOUYGUES / FREE`            | Télécom       |
| `ASSURANCE / PACIFICA / ACM / PREDICA` | Assurances |
| `CAF`                        | CAF           |
| `LECLERC / CARREFOUR / …`   | Courses       |

## API REST

| Route                          | Méthode | Description                   |
|-------------------------------|---------|-------------------------------|
| `/api/accounts`               | GET     | Liste des comptes avec soldes |
| `/api/transactions`           | GET     | Transactions (filtres: month, accountId, type) |
| `/api/transactions/import-csv`| POST    | Import CSV                    |
| `/api/events`                 | GET/POST| Événements agenda             |
| `/api/events/:id/ics`         | GET     | Export .ics                   |
| `/api/shopping`               | GET     | Articles de courses           |
| `/api/todos`                  | GET     | Tâches                        |
| `/api/chat/channels`          | GET     | Salons de chat                |
| `/api/chat/channels/:id/messages` | GET | Messages d'un salon          |

## WebSocket

Connexion sur `ws://localhost:3001/ws`

Messages supportés :
- `{ type: "auth", memberId }` — authentification
- `{ type: "join_channel", channelId }` — rejoindre un salon
- `{ type: "message", channelId, memberId, content }` — envoyer un message
- `{ type: "typing", channelId, memberId }` — indicateur de frappe

## Variables d'environnement

```env
PORT=3001
DB_PATH=./mon-foyer.db
VAPID_PUBLIC=...
VAPID_PRIVATE=...
```

Pour générer des clés VAPID pour les notifications push :
```bash
npx web-push generate-vapid-keys
```
