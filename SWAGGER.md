# Explorer l’API EventHub

Swagger UI est inclus dans le backend et documente les 23 opérations de l’API.

Les trois opérations `/public/events` permettent de consulter le catalogue, lire un événement et envoyer une inscription sans JWT. Les routes de gestion restent protégées. L’inscription publique reçoit nom, email et téléphone facultatif ; elle retourne uniquement un statut `pending` et un message de confirmation.

| Mode | Interface |
| --- | --- |
| Docker, via le frontend | http://localhost:18080/api/docs/ |
| Docker, backend direct | http://localhost:5002/api/docs/ |
| Backend local | http://localhost:5000/api/docs/ |

La spécification OpenAPI 3.0.3 se trouve à `/api/openapi.json` sur la même origine. Elle peut être importée dans Postman. Les ports ci-dessus correspondent à la configuration actuelle.

## Première exploration

1. Ouvrir **Auth → POST /auth/login → Try it out**.
2. Avec la base de démonstration, garder `admin@eventhub.demo` et `EventHub2026!`, puis **Execute**. Sinon, utiliser un compte existant.
3. Copier la valeur `token` de la réponse, sans les guillemets.
4. Cliquer sur **Authorize**, coller uniquement le token (sans `Bearer`), puis **Authorize → Close**.
5. Tester **GET /auth/me**, **GET /dashboard**, **GET /events** et **GET /participants**.
6. Pour le parcours complet : créer un événement, le publier avec **PATCH /events/{id}/status**, créer un participant, puis envoyer leurs UUID dans **POST /registrations**. Confirmer ensuite l’inscription avec **PATCH /registrations/{id}/status**.

Les appels utilisent réellement la base active : les POST, PUT, PATCH et DELETE enregistrent leurs modifications. L’autorisation est conservée uniquement en mémoire jusqu’au rechargement de la page. Les routes Users sont réservées aux admins ; les autres routes métier acceptent admin et staff.

Les schémas indiquent les champs requis, formats et valeurs autorisées. Chaque opération décrit ses erreurs métier, dont capacité pleine, doublon et transition de statut interdite. La documentation est publique ; les données métier restent protégées par JWT.

## Validation

Depuis `eventhub-backend`, `npm.cmd test` valide aussi la spécification, les ressources Swagger et les règles CORS. Depuis `eventhub-frontend`, `npm.cmd run test:e2e:live -- swagger.spec.js` vérifie la connexion et une requête authentifiée dans Swagger sur la base de test isolée.
