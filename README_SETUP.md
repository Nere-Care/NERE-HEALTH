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

## 13) Remarques
- Le dossier `frontend/mobile` contient une application Flutter prête à être développée.
- Le projet est conçu pour être lancé en local avec Docker ou en mode développement séparé.
- En cas de conflit PostgreSQL local, Docker expose la base sur le port `5433`.
