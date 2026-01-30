import { Server, Socket } from 'socket.io';
import { verifyToken, JwtPayload } from '../middleware';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  Role,
  FIBONACCI_VALUES,
  FibonacciValue,
} from '@planning-poker/shared';
import { roomService } from '../services';

interface AuthenticatedSocket extends Socket<ClientToServerEvents, ServerToClientEvents> {
  user?: JwtPayload;
  currentRoom?: string;
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name && rest.length > 0) {
      cookies[name] = rest.join('=');
    }
  });
  
  return cookies;
}

export function setupSocketHandlers(io: Server<ClientToServerEvents, ServerToClientEvents>): void {
  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const cookies = parseCookies(socket.handshake.headers.cookie);
    const token = socket.handshake.auth.token || cookies.token;

    if (!token) {
      console.log('Socket auth failed: No token found');
      return next(new Error('Authentication required'));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('Socket auth failed: Invalid token');
      return next(new Error('Invalid token'));
    }

    socket.user = decoded;
    next();
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.user?.userId} (socket: ${socket.id})`);

    // Join room
    socket.on('join_room', async ({ roomId }) => {
      console.log(`User ${socket.user?.userId} attempting to join room ${roomId}`);
      try {
        const room = await roomService.joinRoom(roomId, socket.user!.userId);
        
        socket.join(roomId);
        socket.currentRoom = roomId;

        console.log(`User ${socket.user?.userId} joined room ${roomId}, participants: ${room.participants.length}`);

        // Send room state to the joining user
        socket.emit('room_state', room);

        // Notify others in the room
        const participant = room.participants.find(p => p.userId === socket.user!.userId);
        if (participant) {
          socket.to(roomId).emit('user_joined', participant);
        }
      } catch (error: unknown) {
        const err = error as { message?: string };
        console.error(`User ${socket.user?.userId} failed to join room ${roomId}:`, err.message);
        socket.emit('error', err.message || 'Failed to join room');
      }
    });

    // Leave room
    socket.on('leave_room', async ({ roomId }) => {
      try {
        await roomService.leaveRoom(roomId, socket.user!.userId);
        socket.leave(roomId);
        socket.currentRoom = undefined;
        socket.to(roomId).emit('user_left', socket.user!.userId);
      } catch (error: unknown) {
        const err = error as { message?: string };
        socket.emit('error', err.message || 'Failed to leave room');
      }
    });

    // Submit vote
    socket.on('submit_vote', async ({ roomId, value }) => {
      try {
        if (!FIBONACCI_VALUES.includes(value as FibonacciValue)) {
          socket.emit('error', 'Invalid vote value');
          return;
        }

        const room = await roomService.submitVote(roomId, socket.user!.userId, value);
        
        // Notify all users that someone voted (without revealing the value)
        io.to(roomId).emit('vote_submitted', { userId: socket.user!.userId });

        // Check if all players have voted
        if (roomService.checkAllVoted(room)) {
          // Auto-reveal could be enabled here
          // For now, we'll let the admin manually reveal
        }
      } catch (error: unknown) {
        const err = error as { message?: string };
        socket.emit('error', err.message || 'Failed to submit vote');
      }
    });

    // Reveal votes (admin only)
    socket.on('reveal_votes', async ({ roomId }) => {
      try {
        const results = await roomService.revealVotes(roomId, socket.user!.userId);
        io.to(roomId).emit('votes_revealed', results);
      } catch (error: unknown) {
        const err = error as { message?: string };
        socket.emit('error', err.message || 'Failed to reveal votes');
      }
    });

    // Reset voting (admin only)
    socket.on('reset_voting', async ({ roomId }) => {
      try {
        await roomService.resetVoting(roomId, socket.user!.userId);
        io.to(roomId).emit('voting_reset');
        
        // Send updated room state
        const room = await roomService.getRoom(roomId);
        if (room) {
          io.to(roomId).emit('room_state', room);
        }
      } catch (error: unknown) {
        const err = error as { message?: string };
        socket.emit('error', err.message || 'Failed to reset voting');
      }
    });

    // Change current issue (admin only)
    socket.on('change_issue', async ({ roomId, issue }) => {
      try {
        await roomService.changeIssue(roomId, socket.user!.userId, issue);
        io.to(roomId).emit('issue_changed', issue);
        
        // Send updated room state
        const room = await roomService.getRoom(roomId);
        if (room) {
          io.to(roomId).emit('room_state', room);
        }
      } catch (error: unknown) {
        const err = error as { message?: string };
        socket.emit('error', err.message || 'Failed to change issue');
      }
    });

    // Add issue to backlog (admin only)
    socket.on('add_issue', async ({ roomId, title, description }) => {
      try {
        const issue = await roomService.addIssue(roomId, socket.user!.userId, title, description);
        io.to(roomId).emit('issue_added', issue);
      } catch (error: unknown) {
        const err = error as { message?: string };
        socket.emit('error', err.message || 'Failed to add issue');
      }
    });

    // Remove issue from backlog (admin only)
    socket.on('remove_issue', async ({ roomId, issueId }) => {
      try {
        await roomService.removeIssue(roomId, socket.user!.userId, issueId);
        io.to(roomId).emit('issue_removed', issueId);
      } catch (error: unknown) {
        const err = error as { message?: string };
        socket.emit('error', err.message || 'Failed to remove issue');
      }
    });

    // Update participant role (admin only)
    socket.on('update_role', async ({ roomId, userId, role }) => {
      try {
        if (!Object.values(Role).includes(role)) {
          socket.emit('error', 'Invalid role');
          return;
        }

        await roomService.updateRole(roomId, socket.user!.userId, userId, role);
        io.to(roomId).emit('role_updated', { userId, role });
        
        // Send updated room state
        const room = await roomService.getRoom(roomId);
        if (room) {
          io.to(roomId).emit('room_state', room);
        }
      } catch (error: unknown) {
        const err = error as { message?: string };
        socket.emit('error', err.message || 'Failed to update role');
      }
    });

    // Start timer (admin only)
    socket.on('start_timer', async ({ roomId, duration }) => {
      try {
        const endTime = await roomService.startTimer(roomId, socket.user!.userId, duration);
        io.to(roomId).emit('timer_started', endTime);
      } catch (error: unknown) {
        const err = error as { message?: string };
        socket.emit('error', err.message || 'Failed to start timer');
      }
    });

    // Stop timer (admin only)
    socket.on('stop_timer', async ({ roomId }) => {
      try {
        await roomService.stopTimer(roomId, socket.user!.userId);
        io.to(roomId).emit('timer_stopped');
      } catch (error: unknown) {
        const err = error as { message?: string };
        socket.emit('error', err.message || 'Failed to stop timer');
      }
    });

    // Kick participant (admin only)
    socket.on('kick_participant', async ({ roomId, userId }) => {
      try {
        const room = await roomService.getRoom(roomId);
        if (!room || room.adminId !== socket.user!.userId) {
          socket.emit('error', 'Only admin can kick participants');
          return;
        }

        await roomService.leaveRoom(roomId, userId);
        io.to(roomId).emit('participant_kicked', userId);
        
        // Send updated room state
        const updatedRoom = await roomService.getRoom(roomId);
        if (updatedRoom) {
          io.to(roomId).emit('room_state', updatedRoom);
        }
      } catch (error: unknown) {
        const err = error as { message?: string };
        socket.emit('error', err.message || 'Failed to kick participant');
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user?.userId}`);
      
      if (socket.currentRoom && socket.user) {
        try {
          await roomService.leaveRoom(socket.currentRoom, socket.user.userId);
          socket.to(socket.currentRoom).emit('user_left', socket.user.userId);
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      }
    });
  });
}
