# EventHub

Application de gestion d’événements et d’inscriptions : publication, participants, suivi des places et tableau de bord. Les admins gèrent également les comptes des opérateurs ; les comptes staff accèdent aux opérations métier.

Le portail public permet de découvrir les événements publiés à venir et de s’inscrire sans compte. L’équipe traite ensuite les inscriptions depuis son espace privé.

**Stack :** React, Vite, Tailwind CSS, Node.js, Express et PostgreSQL. Authentification JWT, mots de passe bcrypt et validation Zod.

## Démarrage avec Docker

Prérequis : Git, Node.js 22.12+ et Docker avec Compose. Docker doit être démarré en mode conteneurs Linux.

```sh
git clone https://github.com/Nmouhly/EventHub.git
cd EventHub
node scripts/setup-docker-env.mjs
docker compose up --build -d --wait
docker compose exec backend npm run db:seed
```

Exécuter le seed uniquement sur une base vide. Les données sont conservées dans un volume PostgreSQL. Les secrets sont générés dans `.env`, exclu de Git.

- Application : http://localhost:18080
- Connexion des organisateurs : http://localhost:18080/login
- Swagger : http://localhost:18080/api/docs/
- Santé de l’API : http://localhost:5002/api/health

Le [guide Docker](DOCKER.md) détaille les ports, les variables, l’arrêt et le redémarrage. Pour travailler sans Docker, suivre l’[installation backend](eventhub-backend/README.md#installation-sur-une-nouvelle-machine) et le [guide frontend](eventhub-frontend/README.md).

Pour développer avec Vite tout en conservant les données de Docker, utiliser la [base commune](DOCKER.md#partager-la-base-avec-le-développement-local). Les espaces public et organisateur partagent alors les mêmes inscriptions, quel que soit le frontend utilisé.

## Comptes de démonstration

| Rôle | Email | Mot de passe |
| --- | --- | --- |
| Admin | admin@eventhub.demo | EventHub2026! |
| Staff | staff@eventhub.demo | EventHub2026! |

Le seed contient 5 événements, 10 participants et 20 inscriptions avec différents statuts.

## Organisation

Le visiteur choisit un événement, renseigne ses coordonnées et reçoit une confirmation à l’écran. La demande est créée en `pending` et réserve une place ; le staff peut la confirmer ou l’annuler. Aucun email automatique n’est envoyé. L’adresse email est déclarative : sa propriété n’est pas vérifiée. Une vérification email serait nécessaire avant une ouverture publique à grande échelle.

Le portail n’expose ni liste des participants, ni coordonnées, ni identité des organisateurs. Une fiche existante n’est pas modifiée par une inscription publique. Les inscriptions sont limitées à 30 requêtes par IP sur 15 minutes.

```text
eventhub-frontend/   Pages React, composants, client API et tests navigateur
eventhub-backend/    API Express, services métier, SQL et tests backend
scripts/            Configuration et vérification Docker
compose.yaml        Frontend, backend et PostgreSQL
```

Le backend sépare routes, contrôleurs, services et requêtes SQL. Les transactions et verrous PostgreSQL empêchent les dépassements de capacité lors d’inscriptions concurrentes. L’annulation d’un événement annule ses inscriptions dans la même transaction.

## Tests

Après préparation de l’environnement de test décrite dans le [guide backend](eventhub-backend/README.md#tests-et-vérifications) :

```sh
cd eventhub-backend
npm test
cd ../eventhub-frontend
npm test
npm run test:e2e
npm run test:e2e:live
npm run build
```

Sous PowerShell, utiliser `npm.cmd` si `npm.ps1` est bloqué. Les tests d’intégration utilisent des bases dédiées. Depuis la racine, `node scripts/check-docker.mjs` vérifie les services Docker après initialisation du seed.

## Documentation

- [Architecture backend, ERD et règles métier](eventhub-backend/README.md)
- [Frontend et mode démonstration](eventhub-frontend/README.md)
- [Explorer l’API avec Swagger](SWAGGER.md)
- [Couverture des tests et résultats de validation](eventhub-backend/docs/verification.md)
