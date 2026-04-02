FROM node:20-alpine
WORKDIR /app
ARG VITE_API_URL=http://localhost:8100
ENV NODE_ENV=development
ENV VITE_API_URL=${VITE_API_URL}
COPY package*.json ./
RUN npm install --legacy-peer-deps --include=dev
COPY . .
RUN npm run build
EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]
