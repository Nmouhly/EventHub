# EventHub

**Swagger/OpenAPI : [guide de test de l’API](SWAGGER.md)** — [ouvrir Swagger avec Docker](http://localhost:18080/api/docs/).

**Docker Compose (frontend + backend + PostgreSQL) : [guide étape par étape](DOCKER.md).**

Le projet est organisé en deux applications indépendantes :

```text
EventHub/
├── eventhub-frontend/   React, Vite, composants et tests navigateur
├── eventhub-backend/    Express, PostgreSQL, schéma, seed et tests API
├── .local/             Instance PostgreSQL locale (ignorée par Git)
├── .gitignore
└── README.md
```

Les fichiers `.env`, dépendances, sources et tests ont été conservés dans leurs applications respectives. Les données PostgreSQL restent dans `.local/`.

## Installation sur une nouvelle machine

Suivre [DOCKER.md](DOCKER.md) pour une installation complète avec PostgreSQL, ou le [guide backend](eventhub-backend/README.md#installation-sur-une-nouvelle-machine) pour une installation sans Docker. Les commandes ci-dessous concernent le poste déjà configuré.

## Lancer le projet

Dans un terminal backend :

```powershell
cd C:\wamp64\www\EventHub\eventhub-backend
npm.cmd install
npm.cmd run dev
```

Dans un terminal frontend :

```powershell
cd C:\wamp64\www\EventHub\eventhub-frontend
npm.cmd install
npm.cmd run dev -- --port 5173 --strictPort
```

Frontend : http://localhost:5173. API : http://localhost:5000/api.

La configuration locale et les bases existent déjà. Ne pas écraser les `.env` ni réappliquer le seed aux données existantes. Après redémarrage Windows, relancer PostgreSQL avec la commande du [guide backend](eventhub-backend/README.md#configuration-déjà-préparée-sur-ce-poste).

## Comptes de démonstration

- Admin : `admin@eventhub.demo` / `EventHub2026!`
- Staff : `staff@eventhub.demo` / `EventHub2026!`

## Vérifications

Depuis `eventhub-backend` : `npm.cmd test`.

Depuis `eventhub-frontend` : `npm.cmd test`, `npm.cmd run build`, `npm.cmd run test:e2e` (offline), `npm.cmd run test:e2e:live` (API/PostgreSQL réels). Les tests live démarrent automatiquement le backend depuis le dossier voisin `../eventhub-backend`.

Documentation : [frontend](eventhub-frontend/README.md), [backend et installation PostgreSQL](eventhub-backend/README.md), [contrat API](eventhub-backend/docs/frontend-contract.md), [recette finale](eventhub-backend/docs/verification.md).
