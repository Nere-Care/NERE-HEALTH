FROM node:20-alpine
WORKDIR /app
ARG VITE_API_URL=http://localhost:8000
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
ENV NODE_ENV=development
COPY package*.json ./
RUN npm install --legacy-peer-deps --include=dev
COPY . .
EXPOSE 5173
EXPOSE 4173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
