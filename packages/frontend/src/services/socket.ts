import { io, Socket } from 'socket.io-client';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  FibonacciValue,
  Issue,
  Role,
} from '@planning-poker/shared';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

export const socketService = {
  connect(): TypedSocket {
    if (socket?.connected) {
      return socket;
    }

    socket = io({
      withCredentials: true,
      autoConnect: true,
    });

    return socket;
  },

  disconnect(): void {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getSocket(): TypedSocket | null {
    return socket;
  },

  joinRoom(roomId: string): void {
    socket?.emit('join_room', { roomId });
  },

  leaveRoom(roomId: string): void {
    socket?.emit('leave_room', { roomId });
  },

  submitVote(roomId: string, value: FibonacciValue): void {
    socket?.emit('submit_vote', { roomId, value });
  },

  revealVotes(roomId: string): void {
    socket?.emit('reveal_votes', { roomId });
  },

  resetVoting(roomId: string): void {
    socket?.emit('reset_voting', { roomId });
  },

  changeIssue(roomId: string, issue: Issue): void {
    socket?.emit('change_issue', { roomId, issue });
  },

  addIssue(roomId: string, title: string, description?: string): void {
    socket?.emit('add_issue', { roomId, title, description });
  },

  removeIssue(roomId: string, issueId: string): void {
    socket?.emit('remove_issue', { roomId, issueId });
  },

  updateRole(roomId: string, userId: string, role: Role): void {
    socket?.emit('update_role', { roomId, userId, role });
  },

  startTimer(roomId: string, duration: number): void {
    socket?.emit('start_timer', { roomId, duration });
  },

  stopTimer(roomId: string): void {
    socket?.emit('stop_timer', { roomId });
  },

  kickParticipant(roomId: string, userId: string): void {
    socket?.emit('kick_participant', { roomId, userId });
  },
};
