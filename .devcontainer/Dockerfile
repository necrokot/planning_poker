FROM node:18-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    postgresql-client \
    redis-tools \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /workspace/node_modules \
    /workspace/packages/backend/node_modules \
    /workspace/packages/frontend/node_modules \
    /workspace/packages/shared/node_modules \
    && chown -R node:node /workspace

USER node
WORKDIR /workspace
