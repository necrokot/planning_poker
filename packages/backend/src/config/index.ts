import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env from the monorepo root
const envPath = path.join(process.cwd(), '.env');
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
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/planning_poker',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Room limits
  maxRoomsPerUser: parseInt(process.env.MAX_ROOMS_PER_USER || '3', 10),
  roomTtlSeconds: parseInt(process.env.ROOM_TTL_SECONDS || '86400', 10),
  sessionTtlSeconds: parseInt(process.env.SESSION_TTL_SECONDS || '604800', 10),
};
