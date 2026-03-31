FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=development
COPY package*.json ./
RUN npm install --legacy-peer-deps --include=dev
COPY . .
RUN npm run build
EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]
