import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

// Load .env from the monorepo root (two levels up from packages/backend/src)
const findEnvPath = (): string => {
  // Try current working directory first
  let envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) return envPath;

  // Try monorepo root (when running from packages/backend)
  envPath = path.join(process.cwd(), '..', '..', '.env');
  if (fs.existsSync(envPath)) return envPath;

  // Try relative to this file (dist/config or src/config -> root)
  envPath = path.join(__dirname, '..', '..', '..', '..', '.env');
  if (fs.existsSync(envPath)) return envPath;

  // Fallback to cwd
  return path.join(process.cwd(), '.env');
};

const envPath = findEnvPath();
console.log('Loading .env from:', envPath);
console.log('.env exists:', fs.existsSync(envPath));
dotenv.config({ path: envPath });
console.log('GOOGLE_CLIENT_ID loaded:', process.env.GOOGLE_CLIENT_ID ? 'YES' : 'NO');

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Google OAuth
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/callback',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'development-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRY || '7d',
  },

  // Database
  databaseUrl: (() => {
    const url =
      process.env.DATABASE_URL ||
      `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'postgres'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'planning_poker'}`;
    process.env.DATABASE_URL = url;
    return url;
  })(),

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Room limits
  maxRoomsPerUser: parseInt(process.env.MAX_ROOMS_PER_USER || '3', 10),
  roomTtlSeconds: parseInt(process.env.ROOM_TTL_SECONDS || '86400', 10),
  sessionTtlSeconds: parseInt(process.env.SESSION_TTL_SECONDS || '604800', 10),

  // Dev mode (for local development only)
  isDev: (process.env.NODE_ENV || 'development') !== 'production',
};
