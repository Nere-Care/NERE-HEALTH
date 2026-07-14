FROM node:20-alpine

WORKDIR /app

# Variable d'environnement pour l'URL de l'API
ARG VITE_API_URL=http://localhost:8100
ENV VITE_API_URL=${VITE_API_URL}

# Copier uniquement les fichiers de dépendances pour optimiser le cache Docker
COPY package*.json ./

# Installer les dépendances
RUN npm install --legacy-peer-deps

# Copier le reste du code (sera de toute façon monté via le volume, mais nécessaire pour la build initiale)
COPY . .

# Exposer le port par défaut de Vite en mode développement
EXPOSE 5173

# Lancer Vite en mode DÉVELOPPEMENT (pas de build, pas de preview)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]