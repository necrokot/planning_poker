#!/usr/bin/env bash
set -euo pipefail

echo "Installing dependencies..."
npm install

echo "Generating Prisma client..."
npm run db:generate -w @planning-poker/backend

echo "Running database migrations..."
npm run db:migrate -w @planning-poker/backend

echo "Building shared package..."
npm run build -w @planning-poker/shared

echo "Devcontainer setup complete! Run 'npm run dev' to start."
