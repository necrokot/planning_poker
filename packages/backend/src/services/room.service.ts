import {
  type FibonacciValue,
  type Issue,
  type Participant,
  Role,
  type Room,
  type RoomSummary,
  type VotingResults,
} from '@planning-poker/shared';
import { config } from '../config';
import { createError } from '../middleware';
import { roomRepository, userRepository } from '../repositories';

export const roomService = {
  async createRoom(userId: string, name: string): Promise<Room> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw createError('User not found', 404);
    }

    const roomCount = await roomRepository.getUserRoomCount(userId);
    if (roomCount >= config.maxRoomsPerUser) {
      throw createError(
        `Maximum ${config.maxRoomsPerUser} active rooms allowed`,
        400,
        'MAX_ROOMS_EXCEEDED',
      );
    }

    return roomRepository.create(userId, name, user.name, user.avatarUrl);
  },

  async getRoom(roomId: string): Promise<Room | null> {
    return roomRepository.findById(roomId);
  },

  async getUserRooms(userId: string): Promise<RoomSummary[]> {
    const roomIds = await roomRepository.getUserRooms(userId);
    const rooms: RoomSummary[] = [];

    for (const roomId of roomIds) {
      const room = await roomRepository.findById(roomId);
      if (room) {
        rooms.push({
          id: room.id,
          name: room.name,
          participantCount: room.participants.filter((p) => p.isConnected).length,
          createdAt: room.createdAt,
        });
      }
    }

    return rooms;
  },

  async deleteRoom(roomId: string, userId: string): Promise<boolean> {
    const room = await roomRepository.findById(roomId);
    if (!room) {
      throw createError('Room not found', 404);
    }
    if (room.adminId !== userId) {
      throw createError('Only admin can delete the room', 403);
    }
    return roomRepository.delete(roomId, userId);
  },

  async joinRoom(roomId: string, userId: string): Promise<Room> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw createError('User not found', 404);
    }

    const room = await roomRepository.findById(roomId);
    if (!room) {
      throw createError('Room not found', 404);
    }

    const existingParticipant = room.participants.find((p) => p.userId === userId);
    const participant: Participant = existingParticipant || {
      userId,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: userId === room.adminId ? Role.ADMIN : Role.SPECTATOR,
      hasVoted: false,
      isConnected: true,
    };

    const updatedRoom = await roomRepository.addParticipant(roomId, participant);
    if (!updatedRoom) {
      throw createError('Failed to join room', 500);
    }

    return updatedRoom;
  },

  async leaveRoom(roomId: string, userId: string): Promise<Room | null> {
    return roomRepository.removeParticipant(roomId, userId);
  },

  async submitVote(roomId: string, userId: string, value: FibonacciValue): Promise<Room> {
    const room = await roomRepository.findById(roomId);
    if (!room) {
      throw createError('Room not found', 404);
    }

    const participant = room.participants.find((p) => p.userId === userId);
    if (!participant) {
      throw createError('Not a participant in this room', 403);
    }
    if (participant.role !== Role.PLAYER) {
      throw createError('Only players can vote', 403);
    }
    if (room.isRevealed) {
      throw createError('Voting has ended', 400);
    }

    const updatedRoom = await roomRepository.submitVote(roomId, userId, value);
    if (!updatedRoom) {
      throw createError('Failed to submit vote', 500);
    }

    return updatedRoom;
  },

  async revealVotes(roomId: string, userId: string): Promise<VotingResults> {
    const room = await roomRepository.findById(roomId);
    if (!room) {
      throw createError('Room not found', 404);
    }
    if (room.adminId !== userId) {
      throw createError('Only admin can reveal votes', 403);
    }

    await roomRepository.revealVotes(roomId);

    return this.calculateResults(room);
  },

  async resetVoting(roomId: string, userId: string): Promise<Room> {
    const room = await roomRepository.findById(roomId);
    if (!room) {
      throw createError('Room not found', 404);
    }
    if (room.adminId !== userId) {
      throw createError('Only admin can reset voting', 403);
    }

    const updatedRoom = await roomRepository.resetVotes(roomId);
    if (!updatedRoom) {
      throw createError('Failed to reset voting', 500);
    }

    return updatedRoom;
  },

  async changeIssue(roomId: string, userId: string, issue: Issue): Promise<Room> {
    const room = await roomRepository.findById(roomId);
    if (!room) {
      throw createError('Room not found', 404);
    }
    if (room.adminId !== userId) {
      throw createError('Only admin can change issue', 403);
    }

    const updatedRoom = await roomRepository.setCurrentIssue(roomId, issue);
    if (!updatedRoom) {
      throw createError('Failed to change issue', 500);
    }

    return updatedRoom;
  },

  async addIssue(
    roomId: string,
    userId: string,
    title: string,
    description?: string,
  ): Promise<Issue> {
    const room = await roomRepository.findById(roomId);
    if (!room) {
      throw createError('Room not found', 404);
    }
    if (room.adminId !== userId) {
      throw createError('Only admin can add issues', 403);
    }

    const issue = await roomRepository.addIssue(roomId, title, description);
    if (!issue) {
      throw createError('Failed to add issue', 500);
    }

    return issue;
  },

  async removeIssue(roomId: string, userId: string, issueId: string): Promise<Room> {
    const room = await roomRepository.findById(roomId);
    if (!room) {
      throw createError('Room not found', 404);
    }
    if (room.adminId !== userId) {
      throw createError('Only admin can remove issues', 403);
    }

    const updatedRoom = await roomRepository.removeIssue(roomId, issueId);
    if (!updatedRoom) {
      throw createError('Failed to remove issue', 500);
    }

    return updatedRoom;
  },

  async updateRole(
    roomId: string,
    adminId: string,
    targetUserId: string,
    role: Role,
  ): Promise<Room> {
    const room = await roomRepository.findById(roomId);
    if (!room) {
      throw createError('Room not found', 404);
    }
    if (room.adminId !== adminId) {
      throw createError('Only admin can change roles', 403);
    }
    if (targetUserId === adminId && role !== Role.ADMIN) {
      throw createError('Admin cannot change their own role', 400);
    }

    const updatedRoom = await roomRepository.updateRole(roomId, targetUserId, role);
    if (!updatedRoom) {
      throw createError('Failed to update role', 500);
    }

    return updatedRoom;
  },

  async startTimer(roomId: string, userId: string, duration: number): Promise<number> {
    const room = await roomRepository.findById(roomId);
    if (!room) {
      throw createError('Room not found', 404);
    }
    if (room.adminId !== userId) {
      throw createError('Only admin can start timer', 403);
    }

    const endTime = Date.now() + duration * 1000;
    await roomRepository.setTimer(roomId, endTime);
    return endTime;
  },

  async stopTimer(roomId: string, userId: string): Promise<void> {
    const room = await roomRepository.findById(roomId);
    if (!room) {
      throw createError('Room not found', 404);
    }
    if (room.adminId !== userId) {
      throw createError('Only admin can stop timer', 403);
    }

    await roomRepository.setTimer(roomId, null);
  },

  calculateResults(room: Room): VotingResults {
    const votes: VotingResults['votes'] = [];
    const values: number[] = [];

    for (const participant of room.participants) {
      if (participant.role === Role.PLAYER && room.votes[participant.userId] !== undefined) {
        const value = room.votes[participant.userId];
        votes.push({ participant, value });
        values.push(value);
      }
    }

    const average =
      values.length > 0
        ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
        : 0;

    const consensus = values.length > 0 && values.every((v) => v === values[0]);

    return { votes, average, consensus };
  },

  checkAllVoted(room: Room): boolean {
    const players = room.participants.filter((p) => p.role === Role.PLAYER && p.isConnected);
    return players.length > 0 && players.every((p) => p.hasVoted);
  },
};
