# Backend Dockerfile
FROM node:18-alpine AS base

WORKDIR /app

# Development stage
FROM base AS development

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/backend/package*.json ./packages/backend/

RUN npm install

COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend

WORKDIR /app/packages/backend

CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/backend/package*.json ./packages/backend/

RUN npm ci

COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend

WORKDIR /app/packages/shared
RUN npm run build

WORKDIR /app/packages/backend
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages/shared/package*.json ./packages/shared/
COPY --from=builder /app/packages/backend/package*.json ./packages/backend/

RUN npm ci --omit=dev

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/prisma ./packages/backend/prisma

WORKDIR /app/packages/backend
RUN npx prisma generate

EXPOSE 3001

CMD ["node", "dist/server.js"]
