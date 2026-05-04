# README_SETUP - NERE-HEALTH

## 1) Objectif
Ce document explique comment installer, configurer et lancer le projet NERE-HEALTH en local. Il couvre :
- backend FastAPI
- frontend React / Vite
- mobile Flutter
- base PostgreSQL
- Docker Compose

## 2) Prérequis
- Windows 10/11 ou Linux
- Python 3.11+
- Node.js 20+
- Docker Desktop + Docker Compose
- Flutter installé pour le dossier mobile
- Git installé pour cloner et versionner

## 3) Cloner le dépôt GitHub
Pour l’équipe :
```powershell
cd C:\chemin\vers\votre\workspace
git clone https://github.com/Nere-Care/NERE-HEALTH.git
cd NERE-HEALTH
```

## 4) Structure du projet
- `backend/` : API FastAPI, configuration, SQLAlchemy
- `frontend/web/` : application React + Vite
- `frontend/mobile/` : application Flutter
- `infra/` : fichiers Docker Compose
- `docker-compose.yml` : orchestrateur stack complet
- `README_SETUP.md` : guide d’installation
- `Documentations NERE/` : cahier des charges, modèles, SQL

## 5) Installation et configuration backend
1. Aller dans le dossier backend :
```powershell
cd backend
```
2. Créer et activer l’environnement virtuel :
```powershell
python -m venv .venv
.\.venv\Scripts\Activate
```
3. Installer les dépendances :
```powershell
pip install --upgrade pip
pip install -r requirements.txt
```
4. Copier le modèle d’environnement :
```powershell
copy .env.example .env
```
5. Modifier `backend/.env` si nécessaire :
- `DATABASE_URL`
- `CORS_ORIGINS`
- `ENVIRONMENT`
- `API_PREFIX`
- `SECRET_KEY`
- `ALLOWED_HOSTS`

> En Docker, `DATABASE_URL` point vers `postgresql://nere_user:nere_pass@db:5432/nere_db`.

5.1) Initialiser Alembic pour les migrations SQLAlchemy
1. Depuis `backend/` :
```powershell
cd backend
alembic -c alembic.ini revision --autogenerate -m "Initial migration"
alembic -c alembic.ini upgrade head
```
2. Si tu veux exécuter une migration depuis la racine du projet :
```powershell
alembic -c backend/alembic.ini revision --autogenerate -m "Initial migration"
alembic -c backend/alembic.ini upgrade head
```

## 6) Installation et configuration frontend
1. Aller dans le dossier frontend/web :
```powershell
cd frontend\web
```
2. Installer les dépendances :
```powershell
npm install
```
3. Copier le modèle d’environnement :
```powershell
copy .env.example .env
```
4. Vérifier `frontend/web/.env` :
- `VITE_API_URL=http://localhost:8000`

## 7) Installation et vérification mobile Flutter
1. Aller dans le dossier mobile :
```powershell
cd frontend\mobile
```
2. Installer les dépendances Flutter :
```powershell
flutter pub get
```
3. Analyser le code Flutter :
```powershell
flutter analyze
```
4. Lancer l’application mobile :
```powershell
flutter run
```

## 8) Lancer le projet en local
### Option Docker compose depuis la racine
```powershell
cd C:\Users\THINKPAD 460\Election_cam\Nere_app
docker compose -f docker-compose.yml up --build
```

### Option Docker compose depuis `infra`
```powershell
cd C:\Users\THINKPAD 460\Election_cam\Nere_app\infra
docker compose up --build
```

### Option de développement sans Docker
- Backend :
```powershell
cd backend
.\.venv\Scripts\Activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
- Frontend :
```powershell
cd frontend\web
npm run dev
```

## 9) Vérification des services
- Backend : `http://localhost:8000/`
- Frontend : `http://localhost:4173/`
- Base PostgreSQL : `localhost:5433`
- Health check backend : `http://localhost:8000/health`

## 10) Tests
### Backend
```powershell
cd backend
.\.venv\Scripts\Activate
pytest
```
### Frontend
```powershell
cd frontend\web
npm run test
```
### Mobile
```powershell
cd frontend\mobile
flutter analyze
```

## 11) Bonnes pratiques Git pour l’équipe
- Toujours synchroniser la branche principale :
```powershell
git checkout main
git pull origin main
```
- Créer une branche dédiée :
```powershell
git checkout -b feature/<description>
```
- Commiter des changements clairs :
```powershell
git add .
git commit -m "Ajout du service X dans le backend"
```
- Pousser la branche :
```powershell
git push -u origin feature/<description>
```
- Ouvrir une Pull Request sur GitHub pour revue avant fusion.

## 12) Sécurité
- Ne pas committer `backend/.env` ni `frontend/web/.env`.
- Utiliser `*.env.example` comme modèle uniquement.
- Mettre à jour les secrets dans `.env` localement.
- Middlewares de sécurité activés en production :
  - Compression GZip
  - Trusted Host validation
  - Headers de sécurité (HSTS, XSS protection, etc.)
  - Rate limiting avec SlowAPI

## 13) Remarques
- Le dossier `frontend/mobile` contient une application Flutter prête à être développée.
- Le projet est conçu pour être lancé en local avec Docker ou en mode développement séparé.
- En cas de conflit PostgreSQL local, Docker expose la base sur le port `5433`.

## 14) Phase 2 : pipeline de production
Cette phase vise à mettre en place une livraison continue pour la production :
- `main` et les tags `v*` construisent et publient des images Docker de production sur GitHub Container Registry.

## 15) Phase 3 : fonctionnalités avancées
Cette phase ajoute les fonctionnalités avancées suivantes :

### Fonctionnalités implémentées
- **IA Diagnostics** : Intégration OpenAI pour l'analyse des symptômes et recommandations médicales
- **Paiements Stripe** : Système de paiement intégré pour les consultations
- **Téléconsultation** : Endpoints WebRTC pour les consultations vidéo
- **Authentification JWT** : Système d'authentification sécurisé
- **Monitoring Sentry** : Suivi des erreurs et performances en production

### Configuration Phase 3
Ajouter ces variables dans `backend/.env` :
```env
# OpenAI pour IA diagnostics
OPENAI_API_KEY=your_openai_api_key_here

# Stripe pour paiements
STRIPE_API_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key

# Monitoring
SENTRY_DSN=your_sentry_dsn_here
```

### Routes Phase 3
- `POST /api/v1/ia/diagnostic` : Analyse IA des symptômes
- `POST /api/v1/payments/create-session` : Création session de paiement Stripe
- `POST /api/v1/teleconsultation/prepare` : Préparation téléconsultation WebRTC
- `GET /api/v1/teleconsultation/{session_id}` : Récupération session téléconsultation

### Tests Phase 3
```powershell
cd backend
pytest tests/test_phase3.py -v
```

### Problèmes résolus récemment
- **Installation frontend** : Conflits de dépendances npm résolus avec `--legacy-peer-deps`
- **Versions compatibles** : Mise à jour Vite 8.0.8, @vitejs/plugin-react 6.0.1, Vitest 2.1.8
- **Backend Phase 3** : Routes IA, paiements et téléconsultation ajoutées dans main.py
- **Dépendances Python** : Installation stripe, openai, sentry-sdk, pytest-asyncio==0.25.1

### Statut Phase 3
✅ Backend : Routes implémentées, tests validés, dépendances installées
✅ Frontend : Installation npm réussie, build fonctionnel
✅ Mobile : Prêt pour développement (Flutter)
✅ Tests : Backend Phase 3 validé, frontend build OK
✅ Documentation : Mise à jour README_SETUP.md
- Un déploiement SSH pull des images est exécuté sur l’hôte de production.
- Le workflow s’appelle `.github/workflows/deploy-production.yml`.

### Validation de sécurité et tests intégrés
- `.github/workflows/ci-full.yml` couvre :
  - backend lint, tests et audit Python
  - frontend tests unitaires + E2E avec Cypress
  - mobile tests unitaires + intégration avec Flutter
  - scan de l’image backend avec Trivy sur `main` ou les tags `v*`

### Release semver automatique
- `.github/workflows/release.yml` utilise `release-please` pour générer une release semver automatique sur chaque push vers `main`.
- Le fichier de configuration est `.release-please-config.json`.

### Secrets à définir dans GitHub Actions
- `PRODUCTION_SSH_KEY`
- `PRODUCTION_SSH_HOST`
- `PRODUCTION_SSH_PORT`
- `PRODUCTION_SSH_USER`
- `PRODUCTION_REGISTRY_USERNAME`
- `PRODUCTION_REGISTRY_PASSWORD`
- `PRODUCTION_DATABASE_URL`
- `PRODUCTION_SECRET_KEY`
- `PRODUCTION_CORS_ORIGINS`
- `PRODUCTION_API_PREFIX`
- `PRODUCTION_FRONTEND_API_URL`

### Comportement attendu
- Fusionner sur `main` déclenche un pipeline CI complet.
- Une release semver est proposée puis publiée automatiquement par `release-please`.
- Les images Docker backend et frontend sont poussées vers GHCR.
- L’hôte de production arrête l’ancienne version et démarre les conteneurs `nere-backend-prod` et `nere-frontend-prod`.
