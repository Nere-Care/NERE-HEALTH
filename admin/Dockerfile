FROM node:20-alpine
WORKDIR /app
ARG VITE_API_URL=http://localhost:8100
ENV VITE_API_URL=${VITE_API_URL}
ENV NODE_ENV=development
COPY package*.json ./
RUN npm install --legacy-peer-deps --include=dev
COPY . .
EXPOSE 4174
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "4174"]
