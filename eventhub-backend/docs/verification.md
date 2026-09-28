# Recette finale — 28 septembre 2026

Résultats de la validation du 28 septembre 2026. Les tests utilisent des bases isolées ; la vérification Docker est en lecture seule sur les données métier.

| Vérification | Résultat |
| --- | --- |
| Backend : `npm.cmd test` | 38 tests réussis, 5 suites |
| Frontend : `npm.cmd test` | 2 tests réussis |
| Frontend : `npm.cmd run build` | Réussi |
| `npm.cmd run test:e2e:live` | 7 tests réussis, API et PostgreSQL réels |
| `npm.cmd run test:e2e` | 3 tests réussis, mode offline sur le port 5176 |
| `node scripts/check-docker.mjs` | Nginx, API, PostgreSQL, JWT, dashboard et fallback SPA validés |
| `docker compose ps` | Trois services healthy |

## Couverture

- Authentification, JWT invalide/expiré, validation, erreurs HTTP et comptes désactivés.
- Administration des opérateurs, restrictions staff, bcrypt et protection du dernier admin.
- Cycle événements, CRUD participants et suppression refusée pour un participant inscrit.
- Inscriptions : publication obligatoire, doublons, capacité, confirmation, annulation et réactivation.
- Concurrence sur la dernière place et annulation atomique des inscriptions.
- Dashboard, bornes temporelles, pagination et recherche littérale.
- Navigation mobile, session et déconnexion sur 401.
- Swagger : validation OpenAPI, ressources, CORS, connexion et requête authentifiée dans le navigateur.
- Portail public : catalogue limité aux événements publiés à venir, absence de données personnelles, inscription sans compte, doublon, concurrence sur la dernière place et rollback du participant si inscription impossible. Parcours visiteur et affichage mobile vérifiés.

## Livrables du cahier des charges

- ERD, PK/FK, contraintes et index : [README backend](../README.md) et [schema.sql](../database/schema.sql).
- API : `eventhub-backend/src/` ; interface : `eventhub-frontend/src/`.
- Données de démonstration : [seed.sql](../database/seed.sql), lancé via `npm run db:seed` : 1 admin, 1 staff, 5 événements, 10 participants et 20 inscriptions.
- Installation et variables : README et `.env.example` des applications.
- Quatre bonus présents : [Docker](../../DOCKER.md), [Swagger](../../SWAGGER.md), tests backend et pagination événements/inscriptions.

## Limites

La recette locale utilise PostgreSQL 12.4 dans une instance indépendante ; Docker utilise PostgreSQL 17. Ce rapport ne constitue pas un audit de production. La réinstallation depuis une copie propre sur un environnement neuf reste à vérifier avant remise.

Les sélecteurs chargent toutes les pages. Aucun refresh token. Le portail public accepte des coordonnées déclaratives sans vérification email ; les demandes sont en attente de confirmation par l’équipe. Les informations d’un événement annulé restent éditables, son statut est terminal.
