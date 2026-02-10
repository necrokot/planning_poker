# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Real-time Planning Poker application. TypeScript monorepo with three packages: `shared` (types), `backend` (Express + Socket.io), `frontend` (React + Vite).

## Commands

```bash
# Development
npm run dev                    # Run backend (port 3001) and frontend (port 3000) concurrently
npm run build                  # Build all packages (shared → backend → frontend)
npm run typecheck              # Type check all packages
npm run lint                   # ESLint all packages
npm run test                   # Jest tests

# Single package
npm run dev -w @planning-poker/backend
npm run dev -w @planning-poker/frontend
npm run test -w @planning-poker/backend

# Database (backend)
npm run db:generate -w @planning-poker/backend   # Generate Prisma client
npm run db:migrate -w @planning-poker/backend    # Run migrations
npm run db:push -w @planning-poker/backend       # Sync schema to DB

# Docker
docker-compose up              # Full dev stack (backend, frontend, postgres, redis, adminer)
```

## Architecture

```
Frontend (React/Zustand/Vite)  ──HTTP + WebSocket──▶  Backend (Express/Socket.io)
                                                        ├── PostgreSQL (users, via Prisma)
                                                        └── Redis (rooms, ephemeral state)
```

**Backend layering:** Socket handlers → Services → Repositories → Data stores (Redis/Postgres)

**Frontend state:** Zustand stores (`authStore`, `roomStore`). The `useRoom` hook manages socket event listeners and room actions. The `useAuth` hook handles auth state.

**Shared package:** Type definitions consumed by both backend and frontend — `Room`, `Participant`, `Vote`, socket event types (`ClientToServerEvents`, `ServerToClientEvents`), API request/response types, and constants like `FIBONACCI_VALUES`.

## Key Files

- `packages/backend/src/socket/index.ts` — Socket.io event handlers (join, vote, reveal, reset, kick, timer, etc.)
- `packages/backend/src/services/room.service.ts` — Room business logic
- `packages/backend/src/repositories/room.repository.ts` — Redis room CRUD
- `packages/frontend/src/hooks/useRoom.ts` — Socket listener setup and room actions
- `packages/frontend/src/store/roomStore.ts` — Zustand room state with voting results calculation
- `packages/frontend/src/services/socket.ts` — Socket.io client emissions
- `packages/frontend/src/services/api.ts` — REST API client
- `packages/shared/src/index.ts` — All shared types and constants

## Environment

Requires `.env` at root (see `.env.example`). Key vars: `DATABASE_URL`, `REDIS_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`. Dev login is available when `NODE_ENV=development`. Vite proxies `/api` and `/socket.io` to the backend.

## Roles

Three participant roles: `ADMIN` (room creator, can reveal/reset/kick/manage), `PLAYER` (can vote), `SPECTATOR` (view only). Role enforcement happens in backend socket handlers and services.
