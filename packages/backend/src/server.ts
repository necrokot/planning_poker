import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { config } from './config';
import { connectRedis } from './config/redis';
import { authRoutes, roomRoutes } from './routes';
import { errorMiddleware, notFoundMiddleware } from './middleware';
import { setupSocketHandlers } from './socket';
import { ClientToServerEvents, ServerToClientEvents } from '@planning-poker/shared';

async function main() {
  const app = express();
  const httpServer = createServer(app);

  // Socket.io setup
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: config.frontendUrl,
      credentials: true,
    },
  });

  // Middleware
  app.use(helmet());
  app.use(cors({
    origin: config.frontendUrl,
    credentials: true,
  }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(passport.initialize());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/rooms', roomRoutes);

  // Error handling
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  // Socket.io handlers
  setupSocketHandlers(io);

  // Connect to Redis
  try {
    await connectRedis();
    console.log('Redis connected');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    process.exit(1);
  }

  // Start server
  httpServer.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`Frontend URL: ${config.frontendUrl}`);
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
