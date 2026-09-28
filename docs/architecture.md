# Architecture EventHub

## Vue d'ensemble

EventHub est une application web full-stack construite sur la stack PERN (PostgreSQL, Express, React, Node.js). Elle permet à une équipe interne de gérer des événements, des participants et des inscriptions, et expose un portail public permettant aux visiteurs de s'inscrire sans créer de compte.

```
┌─────────────────────────────────────────────────────────────┐
│                        Navigateur                           │
│                                                             │
│  ┌──────────────────────────┐  ┌──────────────────────────┐ │
│  │   Portail public (/)     │  │  Espace organisateur     │ │
│  │  Catalogue + inscription │  │  /dashboard → /events …  │ │
│  └────────────┬─────────────┘  └────────────┬─────────────┘ │
└───────────────┼─────────────────────────────┼───────────────┘
                │ HTTP / JSON                 │ HTTP + JWT
                ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│              API Express  (Node.js 22, Express 5)           │
│                                                             │
│   Routes → Controllers → Services → Repositories           │
│                                                             │
│   /api/public/*  (sans auth)                                │
│   /api/auth/*    (login / me)                               │
│   /api/events    /api/participants    /api/registrations     │
│   /api/dashboard /api/users           /api/docs (Swagger)   │
└───────────────────────────────┬─────────────────────────────┘
                                │ pg (pool)
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL 17                               │
│                                                             │
│   users  ──< events ──< registrations >── participants      │
└─────────────────────────────────────────────────────────────┘
```

## Couches backend

| Couche | Rôle | Exemples |
|---|---|---|
| Routes | Validation des entrées, délégation au controller | `eventRoutes.js` |
| Controllers | Réponse HTTP, code de statut | `eventController.js` |
| Services | Logique métier, transactions, machines à états | `eventService.js`, `registrationService.js` |
| Repositories | Requêtes SQL paramétrées, mapping camelCase | `eventRepository.js` |
| Middlewares | Auth JWT, rôle, validation Zod, erreurs, 404 | `authMiddleware.js`, `errorHandler.js` |
| Validators | Schémas Zod stricts (`.strict()`) | `eventValidators.js` |
| Utils | AppError, JWT, date/timezone, pagination | `AppError.js`, `date.js` |

## Couches frontend

| Couche | Rôle |
|---|---|
| `api/` | Fonctions axios centralisées, intercepteurs JWT et 401 |
| `pages/` | Orchestration : données + composants |
| `components/` | Composants réutilisables (Input, Modal, Table…) |
| `hooks/` | `useResource`, `useDebounce`, `useAuth` |
| `context/` | `AuthContext` : token, user, loading |
| `utils/` | Formatage dates, validation frontend, constantes |
| `mocks/` | Serveur de démo offline complet (activé par `VITE_USE_MOCKS=true`) |

## Concurrence et transactions

Toutes les opérations qui modifient la capacité d'un événement utilisent :

1. `BEGIN` sur un client PostgreSQL dédié
2. `SELECT … FOR UPDATE` sur la ligne de l'événement (verrou exclusif de ligne)
3. Vérifications métier (publication, doublon, capacité)
4. `INSERT` ou `UPDATE`
5. `COMMIT` — ou `ROLLBACK` automatique en cas d'erreur

Ce mécanisme garantit qu'aucune dépassement de capacité ne peut se produire même sous charge concurrente.

## Flux d'authentification

```
Login (POST /api/auth/login)
  → bcrypt.compare(password, hash)
  → JWT signé (HS256, issuer, audience, 8h)
  → { token, user }

Requête protégée
  → Bearer token extrait du header Authorization
  → jwt.verify() avec algorithme, issuer et audience
  → findById(sub) en DB → is_active vérifié
  → req.user posé pour les couches suivantes
```

Le token est stocké en `sessionStorage` (non persistent, isolé par onglet). Un 401 reçu sur n'importe quelle requête déclenche un logout automatique.

## Modèle de données (ERD)

Voir [erd.md](erd.md) pour le schéma détaillé.

```
USERS ──< EVENTS ──< REGISTRATIONS >── PARTICIPANTS
```

- `USERS` : opérateurs internes (admin / staff)
- `EVENTS` : événements gérés par les opérateurs
- `PARTICIPANTS` : personnes qui s'inscrivent (public ou ajoutées par le staff)
- `REGISTRATIONS` : table de jonction N-N avec statut (pending / confirmed / cancelled)
