# EventHub avec Docker Compose

Swagger est inclus dans le backend : http://localhost:18080/api/docs/ (proxy) ou http://localhost:5002/api/docs/ (direct). Voir le [guide Swagger](SWAGGER.md) pour tester l’authentification et les opérations métier.

Cette configuration lance trois services : React compilé servi par Nginx, API Express et PostgreSQL 17. Elle crée une base distincte de PostgreSQL local : aucune donnée locale n’est déplacée ou importée.

## 1. Préparer Docker

Prérequis : Node.js 22.12+ pour générer la configuration, Docker Engine avec Compose, ou Docker Desktop en mode conteneurs Linux. Démarrer Docker. Depuis la racine du projet, vérifier :

```powershell
docker version
docker compose version
```

La commande `docker version` doit afficher Client **et Server**.

## 2. Générer la configuration Docker

```powershell
node scripts/setup-docker-env.mjs
docker compose config --quiet
```

Le script génère des secrets aléatoires dans le `.env` **à la racine**, ignoré par Git. Il ne remplace jamais un fichier existant. Les `.env` frontend/backend utilisés hors Docker restent inchangés. Pour une configuration manuelle, suivre `.env.example` et utiliser un mot de passe PostgreSQL hexadécimal afin de pouvoir l’insérer directement dans l’URL de connexion.

## 3. Construire et démarrer

```powershell
docker compose up --build -d --wait
docker compose ps
```

PostgreSQL initialise automatiquement le schéma uniquement à la création du volume. Le backend attend PostgreSQL, puis Nginx attend le backend. Les trois services ont des contrôles de santé.

## 4. Ajouter les comptes et données de démonstration

Une seule fois, sur la nouvelle base Docker vide :

```powershell
docker compose exec backend npm run db:seed
```

Le seed génère les hashes bcrypt et refuse une base déjà remplie. Il n’est pas rejoué automatiquement lors des redémarrages. Aucun besoin de lancer `db:create` ou `db:schema` dans Docker.

## 5. Tester

Ouvrir **http://localhost:18080**. Comptes : `admin@eventhub.demo` ou `staff@eventhub.demo`, mot de passe `EventHub2026!`.

Vérification automatique en lecture seule après le seed : `node scripts/check-docker.mjs`. Pour un autre port frontend, définir `DOCKER_FRONTEND_URL` avant cette commande.

- Frontend : http://localhost:18080
- API directe : http://localhost:5002/api/health
- API via Nginx : http://localhost:18080/api/health
- DBeaver : hôte `127.0.0.1`, port `55433`, base `eventhub`, utilisateur `eventhub_owner`, mot de passe `POSTGRES_PASSWORD` du `.env` racine.

Le frontend appelle `/api` sur sa propre origine. Nginx transmet les requêtes au service `backend:5000`. L’API utilise `postgres:5432` dans le réseau Docker, pas `localhost`. Les ports différents permettent de garder les serveurs locaux 5173/5000/55432.

## Arrêt, redémarrage et diagnostic

```powershell
docker compose logs --tail 100
docker compose logs -f backend
docker compose stop
docker compose start
docker compose down
docker compose up -d --wait
```

`stop` arrête les services. `down` supprime les conteneurs et le réseau mais conserve le volume PostgreSQL. Ne pas ajouter `--volumes` à `down` si les données doivent être conservées. Modifier `POSTGRES_PASSWORD` après initialisation du volume ne modifie pas le mot de passe déjà enregistré dans PostgreSQL.

Après modification du code, utiliser `docker compose up --build -d --wait`. Ce mode sert un build du frontend ; il ne fournit pas le rechargement Vite à chaque modification. Une évolution du schéma sur un volume existant nécessite une migration explicite ; les scripts d’initialisation ne sont pas rejoués.

Les ports sont exposés uniquement sur la machine locale. Cette configuration sert au développement et à la démonstration ; un déploiement public nécessite sa propre configuration HTTPS, sauvegardes et comptes. Le limiteur de connexion est partagé par les clients passant par Nginx tant qu’aucune configuration de proxy de confiance n’est ajoutée à Express.
