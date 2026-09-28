# EventHub

Application de gestion d’événements, de participants et d’inscriptions. Le frontend React/Vite est connecté au backend Express/PostgreSQL dans `../eventhub-backend/`.

**Installation complète, base de données, comptes, endpoints, transactions et tests réels : [../eventhub-backend/README.md](../eventhub-backend/README.md).** Le guide ci-dessous décrit le frontend et son mode offline.

## Lancement

Exécuter les commandes de ce guide depuis `eventhub-frontend/`.

Prérequis : Node.js 22.12+ ou 24 et npm.

```sh
npm ci
cp .env.example .env
npm run dev
```

Sous PowerShell : `Copy-Item .env.example .env`. Si la politique PowerShell bloque `npm.ps1`, utiliser `npm.cmd install` et `npm.cmd run dev`.

Le mode par défaut utilise l’API réelle :

```dotenv
VITE_API_URL=http://localhost:5000/api
VITE_USE_MOCKS=false
```

Pour explorer l’application sans backend, définir `VITE_USE_MOCKS=true` dans `.env`, puis redémarrer Vite. Compte de démonstration : **admin@eventhub.demo**, mot de passe **EventHub2026!**. Les données de démonstration sont stockées dans `localStorage` sous `eventhub.demo.v1`. Supprimer cette clé pour réinitialiser le jeu de données. La session de démonstration utilise un jeton opaque factice ; seul le backend réel émet et vérifie les JWT en production.

## Commandes

- `npm run dev` : serveur de développement.
- `npm run build` : compilation de production dans `dist/`.
- `npm run preview` : prévisualisation du build.
- `npm test` : tests unitaires de validation.
- `npm run test:e2e` : parcours Playwright avec les mocks, desktop et mobile. Edge est utilisé par défaut. Pour Chromium : `npx playwright install chromium`, puis définir `PLAYWRIGHT_CHANNEL=chromium`.
- `npm run test:e2e:live` : parcours avec Express et PostgreSQL réels, mocks désactivés (configuration backend requise).
- `npm run format` : formatage Prettier.

Les tests navigateur démarrent leur propre serveur sur le port 5174 et enregistrent des captures dans `artifacts/`. Le port doit être libre.

## Arborescence

```text
src/
├── api/
│   ├── axios.js
│   ├── authApi.js
│   ├── dashboardApi.js
│   ├── eventsApi.js
│   ├── participantsApi.js
│   ├── registrationsApi.js
│   └── usersApi.js
├── components/
│   ├── common/
│   │   ├── Button.jsx, Input.jsx, Select.jsx
│   │   ├── Modal.jsx, ConfirmDialog.jsx
│   │   ├── Loader.jsx, EmptyState.jsx, ResourceState.jsx
│   │   └── Capacity.jsx, PageHeader.jsx, Pagination.jsx, StatusBadge.jsx
│   ├── events/EventTable.jsx
│   ├── layout/AppLayout.jsx, Navbar.jsx, Sidebar.jsx
│   ├── participants/ParticipantForm.jsx
│   ├── registrations/RegistrationTable.jsx
│   └── users/UserForm.jsx
├── context/AuthContext.jsx
├── hooks/useAuth.js, useDebounce.js, useResource.js
├── mocks/data.js, server.js
├── pages/
│   ├── LoginPage.jsx, DashboardPage.jsx
│   ├── EventsPage.jsx, EventDetailsPage.jsx, EventFormPage.jsx
│   ├── ParticipantsPage.jsx, UsersPage.jsx
│   ├── RegistrationsPage.jsx, NewRegistrationPage.jsx
│   └── NotFoundPage.jsx, UnauthorizedPage.jsx
├── routes/AppRoutes.jsx, ProtectedRoute.jsx
├── utils/constants.js, date.js, validation.js
└── App.jsx, main.jsx, index.css
tests/
├── validation.test.js
├── browser/workflows.spec.js
└── live/ (API réelle, administration, Swagger)
```

## Dépendances

Exécution : React, React DOM, React Router DOM, Axios, Tailwind CSS, intégration Tailwind/Vite, Lucide React pour les icônes.

Développement : Vite, plugin React de Vite, Playwright et Prettier. `package-lock.json` verrouille les versions installées. Les illustrations sont réalisées en CSS ; aucune image ou police distante n’est requise.

## Routes

| Route                          | Fonction                                                 |
| ------------------------------ | -------------------------------------------------------- |
| `/login`                       | Connexion                                                |
| `/`, `/public/events`          | Catalogue public des événements à venir                  |
| `/public/events/:id`           | Détail public et formulaire d’inscription sans compte    |
| `/dashboard`                  | Tableau de bord de l’équipe                              |
| `/events`                      | Liste, recherche, filtres statut/date, publication       |
| `/events/new`                  | Création en brouillon                                    |
| `/events/:id`                  | Détails, capacité, inscriptions                          |
| `/events/:id/edit`             | Édition préremplie                                       |
| `/participants`                | Recherche avec debounce, ajout et édition en modal       |
| `/registrations`               | Liste, filtres événement/statut et changements de statut |
| `/registrations/new?eventId=…` | Inscription, avec événement présélectionné si disponible |
| `/unauthorized`                | Accès interdit                                           |
| `/*`                           | Page introuvable                                         |

Le catalogue, les détails publics et `/login` sont accessibles sans session. Les pages de gestion exigent ADMIN ou STAFF (rôles insensibles à la casse). La page `/users` (« Operators ») est réservée aux admins : recherche, création, modification, activation et désactivation des comptes internes.

Le portail public utilise l’API réelle, même si les mocks de l’espace organisateur sont activés. Il affiche les places restantes et permet une inscription en attente sans création de compte. Les réponses publiques ne contiennent aucune liste ni coordonnée des participants.

La page Participants propose une suppression avec confirmation. L’API refuse la suppression si une inscription existe, même annulée. En mode offline, les fiches opérateurs sont simulées sans stocker leurs mots de passe ; seule la connexion de démonstration est disponible. Utiliser l’API réelle pour tester la connexion des nouveaux comptes.

## API consommée

La base URL contient déjà `/api`. Les services ajoutent uniquement les chemins ci-dessous.

| Méthode | Chemin                      | Corps / paramètres                                                 |
| ------- | --------------------------- | ------------------------------------------------------------------ |
| POST    | `/auth/login`               | `{ email, password }`                                              |
| GET     | `/auth/me`                  | —                                                                  |
| GET     | `/dashboard`                | —                                                                  |
| GET     | `/events`                   | `status`, `date`, `search`, `page`, `limit`                        |
| GET     | `/events/:id`               | —                                                                  |
| POST    | `/events`                   | `title`, `description`, `location`, `eventDate`, `maxParticipants` |
| PUT     | `/events/:id`               | mêmes champs                                                       |
| PATCH   | `/events/:id/status`        | `{ status: "published" }`                                          |
| GET     | `/participants`             | `search`, `page`, `limit`                                          |
| POST    | `/participants`             | `{ fullName, email, phone }`                                       |
| PUT     | `/participants/:id`         | mêmes champs                                                       |
| GET     | `/registrations`            | `eventId`, `status`, `page`, `limit`                               |
| POST    | `/registrations`            | `{ eventId, participantId }`                                       |
| PATCH   | `/registrations/:id/status` | `{ status: "confirmed" \| "cancelled" }`                           |

Réponses attendues :

- Login : `{ token: "JWT", user }`. Profil : `{ id, fullName, name, email, role }`, avec `name` comme alias de compatibilité.
- Objet événement : `{ id, title, description, location, eventDate, maxParticipants, registeredParticipants, status, createdBy: { name?, email? } }`.
- Objet participant : `{ id, fullName, email, phone?, createdAt }`.
- Objet inscription : `{ id, eventId, participantId, status, createdAt, participant: { fullName, email }, event: { title } }`.
- Création/modification : objet enregistré incluant `id`.
- Listes réelles : `{ data: [], total, pagination: { page, limit, total, totalPages } }`. Le helper des services récupère toutes les pages pour les sélecteurs appelés sans `page`. Les tableaux gardent leur pagination serveur. Le mode mock conserve son format compatible.
- Dashboard : `{ totalEvents, publishedEvents, todayRegistrations, totalParticipants, topEvents: [Event], upcomingEvents: [Event] }`. Le classement et les statistiques sont calculés par le backend, jamais dans la page.
- Erreurs métier réelles : `{ success: false, error: { code, message } }`. Le client accepte également le code à la racine pour les mocks et affiche des messages sûrs ; aucune stack trace backend n’est affichée.

## Authentification et règles métier

Le JWT est conservé dans `sessionStorage`, envoyé automatiquement dans `Authorization: Bearer …` et validé via `/auth/me` à la connexion et au rechargement. Une réponse 401 efface la session et les routes protégées redirigent vers `/login`. Un 403 affiche « Accès non autorisé ». La session n’est pas partagée entre onglets et se termine à la fermeture de l’onglet.

Le backend vérifie l’authenticité du token, les droits, l’unicité des emails et inscriptions, la capacité et les transitions de statut. Le frontend propose uniquement les événements publiés, à venir et disposant de places. `registeredParticipants` compte les inscriptions actives (pending + confirmed). Les dates sont envoyées en ISO UTC et affichées dans le fuseau du navigateur. La date de filtre `YYYY-MM-DD` est interprétée dans `APP_TIMEZONE` par le backend.

Les mocks restent dans `src/mocks/`, sont chargés uniquement en mode démonstration et ne remplacent pas un backend sécurisé. Aucun code de connexion fictif n’est accepté en mode API réelle.

## Déploiement

Servir `dist/` depuis la racine du domaine et configurer le serveur pour renvoyer `index.html` sur les routes frontend inconnues (fallback SPA). `npm run dev` utilise le serveur Vite. L’API devra autoriser l’origine du frontend via CORS. Les variables `VITE_*` sont publiques et intégrées au build : ne jamais y mettre de secret.
