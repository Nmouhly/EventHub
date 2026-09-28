# EventHub — API Express/PostgreSQL

API de gestion des événements, participants et inscriptions avec PostgreSQL, `pg`, JWT, bcrypt, Zod, CORS et Helmet. Les opérateurs internes (`users`) et les personnes inscrites (`participants`) sont deux domaines distincts.

## Installation sur une nouvelle machine

Prérequis : Node.js 22.12+ (ou 24), npm et PostgreSQL avec les extensions `pg_trgm` et `pgcrypto`. Docker utilise PostgreSQL 17.

Depuis la racine du projet :

```powershell
cd eventhub-frontend
npm.cmd install
cd ../eventhub-backend
npm.cmd install
Copy-Item .env.example .env
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Configurer `eventhub-backend/.env` avec les identifiants PostgreSQL réels et le secret aléatoire généré. Ne pas conserver le placeholder du secret : le serveur le refuse.

```dotenv
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/eventhub
TEST_DATABASE_URL=postgresql://postgres:password@localhost:5432/eventhub_test
JWT_SECRET=<secret-aléatoire-de-32-caractères-minimum>
JWT_EXPIRES_IN=8h
FRONTEND_URL=http://localhost:5173
APP_TIMEZONE=Africa/Casablanca
```

Les mots de passe contenant des caractères spéciaux doivent être encodés dans l’URL PostgreSQL. Les fichiers `.env` et les données locales sont exclus de Git. La configuration est chargée depuis `eventhub-backend/.env` quel que soit le dossier courant.

Initialiser les bases et le jeu de démonstration :

```powershell
npm.cmd run db:create
npm.cmd run db:schema
npm.cmd run db:seed
node scripts/database.js create --test
node scripts/database.js schema --test
npm.cmd run dev
```

`db:create` est sans effet si la base existe. `db:schema` refuse de modifier un schéma existant. `db:seed` exige des tables vides et refuse de modifier des données existantes. Les scripts de création nécessitent un rôle PostgreSQL avec le droit `CREATEDB`, et l’installation des extensions les droits appropriés. Un administrateur peut préparer les bases/extensions puis fournir un compte applicatif.

Le schéma est dans `database/schema.sql`. Le seed `database/seed.sql` s’exécute via le script Node : celui-ci génère un vrai hash bcrypt (coût 12), le transmet à la session SQL, puis applique le seed dans une transaction. Ne pas exécuter `seed.sql` seul : il attend ce hash de session. Aucun mot de passe en clair n’est stocké dans `password_hash`.

Dans un second terminal, depuis `eventhub-frontend/` :

```powershell
Copy-Item .env.example .env
npm.cmd run dev -- --port 5173 --strictPort
```

Le frontend `.env` doit contenir :

```dotenv
VITE_API_URL=http://localhost:5000/api
VITE_USE_MOCKS=false
```

Ouvrir **http://localhost:5173**. L’API répond sur **http://localhost:5000/api** et sa sonde de connexion DB sur `/api/health`. Pour la production : `npm run build` dans `eventhub-frontend/`, puis servir son dossier `dist/` avec fallback SPA ; démarrer l’API avec `npm start` dans `eventhub-backend/`.

## Comptes et données de démonstration

| Rôle  | Email               | Mot de passe  |
| ----- | ------------------- | ------------- |
| admin | admin@eventhub.demo | EventHub2026! |
| staff | staff@eventhub.demo | EventHub2026! |

Seed : 2 opérateurs, 5 événements (draft/published/cancelled), 10 participants et 20 inscriptions (pending/confirmed/cancelled). Les dates des événements sont relatives à la date du seed. Les inscriptions des événements annulés sont toutes annulées.

## Architecture

```text
eventhub-backend/
├── src/
│   ├── config/          env.js, database.js
│   ├── routes/          auth, events, participants, registrations, dashboard, users, docs
│   ├── controllers/     lecture des entrées validées et réponses HTTP
│   ├── services/        règles métier, transactions et orchestration
│   ├── repositories/    requêtes SQL paramétrées et mapping camelCase
│   ├── validators/      schémas Zod stricts
│   ├── middlewares/     authentification, rôles, validation, erreurs, 404
│   ├── utils/           AppError, JWT, bornes timezone, pagination/ILIKE
│   ├── app.js           application importable par Supertest
│   └── server.js        connexion DB, écoute HTTP et arrêt propre
├── database/            schema.sql, seed.sql
├── scripts/             database.js, browser-fixture.js
├── tests/               unit/, integration/, env.js
├── docs/                verification.md
├── .env.example
├── package.json
├── package-lock.json
└── README.md
```

## Modèle SQL

```mermaid
erDiagram
  USERS ||--o{ EVENTS : creates
  EVENTS ||--o{ REGISTRATIONS : receives
  PARTICIPANTS ||--o{ REGISTRATIONS : registers
  USERS {
    uuid id PK
    text full_name
    text email UK
    text password_hash
    text role
    boolean is_active
    timestamptz created_at
    timestamptz updated_at
  }
  EVENTS {
    uuid id PK
    text title
    text description
    text location
    timestamptz event_date
    integer max_participants
    text status
    uuid created_by FK
    timestamptz cancelled_at
    timestamptz created_at
    timestamptz updated_at
  }
  PARTICIPANTS {
    uuid id PK
    text full_name
    text email UK
    text phone
    timestamptz created_at
    timestamptz updated_at
  }
  REGISTRATIONS {
    uuid id PK
    uuid event_id FK
    uuid participant_id FK
    text status
    timestamptz cancelled_at
    timestamptz created_at
    timestamptz updated_at
  }
```

PK UUID avec `gen_random_uuid()`. Emails uniques, stockés en minuscules et sans espaces périphériques ; noms non vides ; capacité strictement positive. FK `ON DELETE RESTRICT`. Unicité composite `(event_id, participant_id)` permanente, y compris pour les inscriptions annulées. Les CHECK imposent les statuts et l’équivalence `status = 'cancelled' ⇔ cancelled_at IS NOT NULL`.

Les quatre tables ont un trigger `BEFORE UPDATE` appelant `set_updated_at()` ; c’est sa seule responsabilité. Les index couvrent les filtres événements, le créateur, la recherche participants avec GIN/pg_trgm, les inscriptions par événement/statut, participant et date. Aucun index PK/UNIQUE n’est dupliqué.

## Contrat HTTP

### Portail public

`GET /api/public/events?search=&page=&limit=` et `GET /api/public/events/:id` exposent uniquement les événements publiés à venir : titre, description, lieu, date, capacité et places disponibles. Aucun créateur ni participant n’est retourné.

`POST /api/public/events/:id/registrations` reçoit `{ fullName, email, phone? }`, sans JWT. Sous verrou événement, une transaction crée ou retrouve le participant par email puis réutilise le service d’inscription. Une erreur de capacité annule aussi la création du participant. Une fiche existante n’est jamais modifiée. La réponse 201 contient uniquement `{ status: "pending", message }`.

Les coordonnées sont déclaratives, sans vérification email ni envoi de message. Le staff confirme les demandes. Limite : 30 requêtes par IP en 15 minutes ; derrière le proxy Docker, ce quota est partagé tant que le proxy de confiance n’est pas configuré. Les événements passés ne sont pas ouverts à l’inscription publique.

### Gestion interne

Authentification Bearer obligatoire sur les domaines métier. Admin et staff gèrent les événements, participants et inscriptions. La gestion des opérateurs (`/api/users`) est réservée aux admins. Le rôle et `is_active` sont relus en DB à chaque requête ; un token émis avant désactivation ne donne plus accès.

| Méthode | Endpoint                        | Entrée                                                    |
| ------- | ------------------------------- | --------------------------------------------------------- |
| GET     | `/api/health`                   | public, connexion DB                                      |
| POST    | `/api/auth/login`               | `{ email, password }`                                     |
| GET     | `/api/auth/me`                  | token                                                     |
| GET     | `/api/events`                   | status, date, search, page, limit                         |
| POST    | `/api/events`                   | title, description?, location, eventDate, maxParticipants |
| GET     | `/api/events/:id`               | UUID                                                      |
| PUT     | `/api/events/:id`               | mêmes champs modifiables                                  |
| PATCH   | `/api/events/:id/status`        | `{ status }`                                              |
| GET     | `/api/participants`             | search, page, limit                                       |
| POST    | `/api/participants`             | fullName, email, phone?                                   |
| GET     | `/api/participants/:id`         | UUID                                                      |
| PUT     | `/api/participants/:id`         | fullName, email, phone?                                   |
| DELETE  | `/api/participants/:id`         | uniquement sans aucune inscription                        |
| GET     | `/api/registrations`            | eventId, participantId, status, page, limit               |
| POST    | `/api/registrations`            | `{ eventId, participantId }`                              |
| PATCH   | `/api/registrations/:id/status` | `{ status }`                                              |
| GET     | `/api/dashboard`                | statistiques et listes enrichies                          |

Ressources simples retournées directement, conformément au frontend. Login : `{ token, user }`. Profil : `{ id, fullName, name, email, role }` ; `name` est un alias de compatibilité. Aucun hash n’est exposé.

Collections toujours paginées, défaut page 1 / limite 10, maximum 100 :

```json
{
  "data": [],
  "total": 42,
  "pagination": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 }
}
```

`total` à la racine conserve la compatibilité avec les tables React. Les services frontend chargent les pages successives pour les sélecteurs et les détails appelés sans `page` ; les tableaux conservent la pagination serveur. Les filtres vides sont acceptés comme absents. Un `limit` supérieur à 100 est rejeté avec 400. Les champs inconnus sont rejetés par Zod, notamment `createdBy` et `status` sur la création d’événement.

Événements enrichis avec `createdBy: { id, fullName, name, email }` et `registeredParticipants`. Inscriptions enrichies avec `participant: { id, fullName, email }` et `event: { id, title, status }`. Toutes les dates sont des chaînes ISO issues de `timestamptz`.

Dashboard : `totalEvents`, `publishedEvents`, `todayRegistrations`, `totalParticipants`, `topEvents`, `upcomingEvents`. Top 5 exclusivement published, classés par ratio de capacité active ; `fillRate` est un pourcentage. Le dashboard est lu dans une transaction en lecture seule REPEATABLE READ pour garder une vue cohérente des statistiques et des listes.

## Règles métier et transactions

- Événement créé en `draft` ; `created_by` vient exclusivement de l’utilisateur authentifié.
- Transitions : `draft → published/cancelled`, `published → cancelled`. L’état cancelled est terminal ; répéter le même statut retourne 409.
- Les inscriptions pending et confirmed consomment chacune une place ; cancelled n’en consomme pas.
- Créer une inscription prend d’abord un verrou `SELECT … FOR UPDATE` sur l’événement. Sur le même client `pg`, le service vérifie événement/participant, publication, doublon et capacité, puis insère ou réactive.
- Un doublon actif retourne `ALREADY_REGISTERED`. Une inscription cancelled est réactivée sur **la même ligne**, en pending, avec `cancelled_at = NULL`, après contrôle de capacité. `created_at` conserve sa date d’origine. POST retourne 201 dans les deux cas.
- Transitions inscription : pending → confirmed/cancelled ; confirmed → cancelled ; cancelled → pending/confirmed. La réactivation via PATCH applique exactement le même verrou et contrôle de capacité. Tous les changements prennent le verrou événement avant de relire l’inscription afin d’éviter une lecture périmée après une annulation concurrente.
- La réduction de capacité verrouille l’événement puis compte les inscriptions actives. Si le nouveau maximum est inférieur au total, retour 409 `MAX_PARTICIPANTS_TOO_LOW`.
- L’annulation verrouille l’événement, annule l’événement et toutes ses inscriptions non annulées, puis commit. Toute erreur provoque un rollback de l’ensemble.
- Le helper transaction utilise toujours **un seul client issu de `pool.connect()`**, avec BEGIN/COMMIT/ROLLBACK et release. Les opérations sur un même événement sont sérialisées par son verrou de ligne, y compris la concurrence création/annulation/réduction de capacité.
- La suppression d’un participant ayant une inscription, même annulée, est refusée avec 409. La FK protège également le cas concurrent.

Les règles importantes résident dans les services et la DB, pas dans React ni dans des triggers métier. Le frontend continue à proposer les événements à venir, publiés et disposant de places ; le backend exige publication/capacité mais n’ajoute pas une interdiction non demandée des événements passés. Les informations d’un événement annulé restent éditables, mais son statut ne peut pas être réactivé.

## Dates et recherche

Luxon est utilisé uniquement pour calculer correctement les bornes d’une journée dans `APP_TIMEZONE`, y compris un changement de décalage horaire. Les statistiques utilisent `created_at >= start AND created_at < end`, sans `created_at::date`, ce qui garde l’index utilisable. Le filtre `date=YYYY-MM-DD` des événements utilise les mêmes bornes. Une réactivation ne compte pas comme une nouvelle création dans les inscriptions du jour.

Recherche participants sur `full_name` ou email avec `ILIKE`, recherche événements sur title. `%`, `_` et `\` sont échappés pour rechercher leur valeur littérale. Toutes les valeurs SQL sont liées via `$1…$n`. Les segments de requêtes dynamiques proviennent uniquement du code ; les noms de bases des scripts sont des identifiants strictement validés (les identifiants SQL ne peuvent pas être liés comme des valeurs).

## Erreurs et protections HTTP

```json
{
  "success": false,
  "error": { "code": "EVENT_FULL", "message": "This event has reached its maximum capacity." }
}
```

400 validation, 401 session absente/invalide/expirée ou compte désactivé, 403 droits/origine, 404 ressource, 409 conflit métier, 500 erreur inattendue. JSON trop volumineux : 413. Échecs répétés de connexion : 429 (50 échecs/15 minutes/IP, compteur mémoire).

Codes métier : `EVENT_NOT_FOUND`, `PARTICIPANT_NOT_FOUND`, `REGISTRATION_NOT_FOUND`, `EVENT_NOT_PUBLISHED`, `EVENT_FULL`, `ALREADY_REGISTERED`, `INVALID_EVENT_STATUS_TRANSITION`, `INVALID_REGISTRATION_STATUS_TRANSITION`, `MAX_PARTICIPANTS_TOO_LOW`, `EMAIL_ALREADY_EXISTS`, `PARTICIPANT_HAS_REGISTRATIONS`. Codes génériques : `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `INTERNAL_ERROR`.

Les erreurs PostgreSQL 23505/23503/23514 sont converties en erreurs métier/validation ; aucune stack ou erreur SQL technique n’est envoyée au client. Les logs HTTP contiennent méthode, statut et durée, sans corps ni token. Helmet, une limite JSON de 100 Ko et une validation stricte protègent les requêtes. CORS autorise le frontend configuré et les appels de même origine (Swagger). Aucun cookie ni `credentials` n’est nécessaire. JWT HS256 avec expiration, issuer et audience vérifiés. La déconnexion frontend efface son token ; il n’existe pas de liste de révocation ni de refresh token.

## Tests et vérifications

Dans `eventhub-backend/` :

```powershell
npm.cmd test
npm.cmd run test:unit
npm.cmd run test:integration
```

Jest utilise `TEST_DATABASE_URL` et refuse une base ne se terminant pas par `_test` ou identique à `DATABASE_URL`. Les tests d’intégration nettoient uniquement leurs quatre tables de test avant chaque cas. Ils ne remplacent ni PostgreSQL ni `pg` par des mocks. Ne pas exécuter simultanément deux suites Jest sur la même base de test.

Depuis `eventhub-frontend/` :

```powershell
npm.cmd test
npm.cmd run test:e2e
npm.cmd run test:e2e:live
npm.cmd run build
```

Playwright utilise Edge par défaut. Pour Chromium, installer `npx playwright install chromium` puis définir `PLAYWRIGHT_CHANNEL=chromium`. Les tests offline démarrent Vite sur 5174. Les tests réels démarrent Express sur 5001 et Vite sur 5175 avec `VITE_USE_MOCKS=false`, créent/réinitialisent uniquement la base `eventhub_browser_test` dérivée de `TEST_DATABASE_URL`, puis appliquent le schéma et le vrai seed bcrypt. Ils ne touchent pas la base de développement. Le rôle de test doit pouvoir créer cette base, ou elle doit être créée à l’avance. Ces ports doivent être libres.

Les tests couvrent : authentification/compte inactif/JWT, propriété créée côté serveur, transitions, inscriptions/doublons/capacité/réactivation, annulation, réduction de capacité, concurrence pour la dernière place et concurrence annulation/inscription, recherche littérale, pagination, CORS, erreurs JSON, suppression protégée et bornes timezone du dashboard. Les parcours navigateur vérifient le cycle complet et le rôle staff sur mobile. Captures : `artifacts/live-dashboard-desktop.png` et `artifacts/live-dashboard-mobile.png`.

Si 5174 est occupé, définir `$env:PLAYWRIGHT_MOCK_PORT='5176'` avant `npm.cmd run test:e2e`. Résultats de validation : [docs/verification.md](docs/verification.md).

## Documentation et limites

[Docker Compose](../DOCKER.md) décrit le démarrage des trois services. [Swagger](../SWAGGER.md) documente les opérations sur `/api/docs/`, avec la spécification sur `/api/openapi.json`.

Les sélecteurs chargent toutes les pages ; une recherche serveur serait préférable pour de grands volumes.

## Gestion des opérateurs et suppression des participants

La page frontend `/users` (« Operators ») et les endpoints suivants sont exclusivement réservés aux admins :

| Méthode | Endpoint | Entrée |
| --- | --- | --- |
| GET | `/api/users` | search, page, limit |
| POST | `/api/users` | fullName, email, role, isActive, password |
| PUT | `/api/users/:id` | fullName, email, role, isActive |

Les résultats contiennent id/fullName/email/role/isActive/createdAt, jamais le hash. Mot de passe à la création : minimum 12 caractères et maximum 72 octets UTF-8 ; stockage bcrypt. L’édition ne modifie pas le mot de passe. Les comptes sont désactivés plutôt que supprimés pour préserver les événements qu’ils ont créés.

Une désactivation bloque les nouvelles connexions et les requêtes avec un JWT déjà émis. Un admin ne peut pas désactiver son propre compte ni retirer son propre rôle admin (`SELF_ACCESS_CHANGE`). Les écritures administratives sont sérialisées par un verrou de table users dans une transaction ; l’identité et les droits de l’admin sont revérifiés après acquisition du verrou. Au moins un administrateur actif doit rester. Ce verrou empêche notamment deux admins de se désactiver simultanément. Les opérations courantes ne prennent pas ce verrou administratif.

La suppression d’un participant est accessible dans l’interface, avec confirmation et message `PARTICIPANT_HAS_REGISTRATIONS` si le backend refuse. Les tests API couvrent les restrictions staff, les mots de passe hachés, les comptes désactivés et la concurrence administrative. Les tests navigateur réels couvrent création/édition/désactivation/réactivation d’opérateur, accès staff interdit, suppression réussie d’un participant libre et refus pour un participant inscrit.
