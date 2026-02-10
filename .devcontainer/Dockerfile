FROM node:18-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    postgresql-client \
    redis-tools \
    && rm -rf /var/lib/apt/lists/*

USER node
WORKDIR /workspace
