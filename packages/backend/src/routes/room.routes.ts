import { type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { type AuthenticatedRequest, authMiddleware } from '../middleware';
import { roomService } from '../services';

const router = Router();

const createRoomSchema = z.object({
  name: z.string().min(1).max(100),
});

// Create a new room
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name } = createRoomSchema.parse(req.body);
    const room = await roomService.createRoom(authReq.user?.userId, name);
    res.status(201).json({
      room: { id: room.id, name: room.name, participantCount: 1, createdAt: room.createdAt },
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid request body', errors: error.errors });
      return;
    }
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({ message: err.message || 'Failed to create room' });
  }
});

// Get user's rooms
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const rooms = await roomService.getUserRooms(authReq.user?.userId);
    res.json({ rooms });
  } catch {
    res.status(500).json({ message: 'Failed to get rooms' });
  }
});

// Get room by ID
router.get('/:roomId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const room = await roomService.getRoom(req.params.roomId);
    if (!room) {
      res.status(404).json({ message: 'Room not found' });
      return;
    }
    res.json({ room });
  } catch {
    res.status(500).json({ message: 'Failed to get room' });
  }
});

// Delete room
router.delete('/:roomId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    await roomService.deleteRoom(req.params.roomId, authReq.user?.userId);
    res.json({ message: 'Room deleted' });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({ message: err.message || 'Failed to delete room' });
  }
});

export const roomRoutes = router;
