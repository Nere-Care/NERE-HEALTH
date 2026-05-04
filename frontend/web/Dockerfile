FROM node:22-alpine

WORKDIR /app

ARG VITE_API_URL=http://localhost:8000
ENV NODE_ENV=production
ENV VITE_API_URL=${VITE_API_URL}

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nextjs -u 1001

# Copy package files
COPY --chown=nextjs:nodejs package*.json ./

# Install dependencies with security audit
RUN npm ci --only=production --ignore-scripts && \
  npm audit fix --audit-level=moderate && \
  npm cache clean --force

# Copy source code
COPY --chown=nextjs:nodejs . .

# Build application
RUN npm run build

USER nextjs

EXPOSE 4173

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]
