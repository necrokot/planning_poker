import { redis } from '../config/redis';
import { config } from '../config';
import { Room, Participant, Issue, FibonacciValue, Role } from '@planning-poker/shared';
import { v4 as uuidv4 } from 'uuid';

const ROOM_PREFIX = 'room:';
const USER_ROOMS_PREFIX = 'user:rooms:';

export const roomRepository = {
  async create(userId: string, name: string, userName: string, userAvatar: string | null): Promise<Room> {
    const roomId = uuidv4();
    const now = Date.now();

    const adminParticipant: Participant = {
      userId,
      name: userName,
      avatarUrl: userAvatar,
      role: Role.ADMIN,
      hasVoted: false,
      isConnected: false,
    };

    const room: Room = {
      id: roomId,
      name,
      adminId: userId,
      currentIssue: null,
      participants: [adminParticipant],
      votes: {},
      issues: [],
      isVotingOpen: false,
      isRevealed: false,
      timerEndTime: null,
      createdAt: now,
    };

    await redis.set(
      `${ROOM_PREFIX}${roomId}`,
      JSON.stringify(room),
      'EX',
      config.roomTtlSeconds
    );

    await redis.sadd(`${USER_ROOMS_PREFIX}${userId}`, roomId);
    await redis.expire(`${USER_ROOMS_PREFIX}${userId}`, config.roomTtlSeconds);

    return room;
  },

  async findById(roomId: string): Promise<Room | null> {
    const data = await redis.get(`${ROOM_PREFIX}${roomId}`);
    if (!data) return null;
    return JSON.parse(data) as Room;
  },

  async update(room: Room): Promise<void> {
    await redis.set(
      `${ROOM_PREFIX}${room.id}`,
      JSON.stringify(room),
      'EX',
      config.roomTtlSeconds
    );
  },

  async delete(roomId: string, adminId: string): Promise<boolean> {
    const room = await this.findById(roomId);
    if (!room || room.adminId !== adminId) return false;

    await redis.del(`${ROOM_PREFIX}${roomId}`);
    await redis.srem(`${USER_ROOMS_PREFIX}${adminId}`, roomId);
    return true;
  },

  async getUserRoomCount(userId: string): Promise<number> {
    return redis.scard(`${USER_ROOMS_PREFIX}${userId}`);
  },

  async getUserRooms(userId: string): Promise<string[]> {
    return redis.smembers(`${USER_ROOMS_PREFIX}${userId}`);
  },

  async addParticipant(roomId: string, participant: Participant): Promise<Room | null> {
    const room = await this.findById(roomId);
    if (!room) return null;

    const existingIndex = room.participants.findIndex(p => p.userId === participant.userId);
    if (existingIndex >= 0) {
      room.participants[existingIndex] = {
        ...room.participants[existingIndex],
        isConnected: true,
      };
    } else {
      room.participants.push(participant);
    }

    await this.update(room);
    return room;
  },

  async removeParticipant(roomId: string, userId: string): Promise<Room | null> {
    const room = await this.findById(roomId);
    if (!room) return null;

    const participant = room.participants.find(p => p.userId === userId);
    if (participant) {
      participant.isConnected = false;
    }

    delete room.votes[userId];

    // Also remove vote from current issue
    if (room.currentIssue?.votes) {
      delete room.currentIssue.votes[userId];
      const issueIndex = room.issues.findIndex(i => i.id === room.currentIssue!.id);
      if (issueIndex >= 0 && room.issues[issueIndex].votes) {
        delete room.issues[issueIndex].votes[userId];
      }
    }

    await this.update(room);
    return room;
  },

  async submitVote(roomId: string, userId: string, value: FibonacciValue): Promise<Room | null> {
    const room = await this.findById(roomId);
    if (!room) return null;

    const participant = room.participants.find(p => p.userId === userId);
    if (!participant || participant.role !== Role.PLAYER) return null;

    room.votes[userId] = value;
    participant.hasVoted = true;

    // Also save vote to the current issue for persistence
    if (room.currentIssue) {
      if (!room.currentIssue.votes) {
        room.currentIssue.votes = {};
      }
      room.currentIssue.votes[userId] = value;
      const issueIndex = room.issues.findIndex(i => i.id === room.currentIssue!.id);
      if (issueIndex >= 0) {
        if (!room.issues[issueIndex].votes) {
          room.issues[issueIndex].votes = {};
        }
        room.issues[issueIndex].votes[userId] = value;
      }
    }

    await this.update(room);
    return room;
  },

  async revealVotes(roomId: string): Promise<Room | null> {
    const room = await this.findById(roomId);
    if (!room) return null;

    room.isRevealed = true;
    room.isVotingOpen = false;

    // Also save the revealed state to the current issue
    if (room.currentIssue) {
      room.currentIssue.isRevealed = true;
      room.currentIssue.votes = { ...room.votes };
      const issueIndex = room.issues.findIndex(i => i.id === room.currentIssue!.id);
      if (issueIndex >= 0) {
        room.issues[issueIndex].isRevealed = true;
        room.issues[issueIndex].votes = { ...room.votes };
      }
    }

    await this.update(room);
    return room;
  },

  async resetVotes(roomId: string): Promise<Room | null> {
    const room = await this.findById(roomId);
    if (!room) return null;

    room.votes = {};
    room.isRevealed = false;
    room.isVotingOpen = true;
    room.participants.forEach(p => {
      p.hasVoted = false;
    });

    // Also reset votes on the current issue
    if (room.currentIssue) {
      room.currentIssue.votes = {};
      room.currentIssue.isRevealed = false;
      const issueIndex = room.issues.findIndex(i => i.id === room.currentIssue!.id);
      if (issueIndex >= 0) {
        room.issues[issueIndex].votes = {};
        room.issues[issueIndex].isRevealed = false;
      }
    }

    await this.update(room);
    return room;
  },

  async setCurrentIssue(roomId: string, issue: Issue | null): Promise<Room | null> {
    const room = await this.findById(roomId);
    if (!room) return null;

    // Save current votes to the old issue before switching
    if (room.currentIssue) {
      const oldIssueIndex = room.issues.findIndex(i => i.id === room.currentIssue!.id);
      if (oldIssueIndex >= 0) {
        room.issues[oldIssueIndex].votes = { ...room.votes };
        room.issues[oldIssueIndex].isRevealed = room.isRevealed;
      }
      // Also update the currentIssue reference
      room.currentIssue.votes = { ...room.votes };
      room.currentIssue.isRevealed = room.isRevealed;
    }

    // Load votes from the new issue (if it exists and has saved votes)
    if (issue) {
      const savedIssue = room.issues.find(i => i.id === issue.id);
      if (savedIssue?.votes) {
        room.votes = { ...savedIssue.votes };
        room.isRevealed = savedIssue.isRevealed ?? false;
        // Restore hasVoted flags based on saved votes
        room.participants.forEach(p => {
          p.hasVoted = room.votes[p.userId] !== undefined;
        });
        room.isVotingOpen = !room.isRevealed;
      } else {
        // New issue with no saved votes - reset voting
        room.votes = {};
        room.isRevealed = false;
        room.isVotingOpen = true;
        room.participants.forEach(p => {
          p.hasVoted = false;
        });
      }
      room.currentIssue = issue;
    } else {
      // No issue selected - reset voting
      room.currentIssue = null;
      room.votes = {};
      room.isRevealed = false;
      room.isVotingOpen = true;
      room.participants.forEach(p => {
        p.hasVoted = false;
      });
    }

    await this.update(room);
    return room;
  },

  async addIssue(roomId: string, title: string, description?: string): Promise<Issue | null> {
    const room = await this.findById(roomId);
    if (!room) return null;

    const issue: Issue = {
      id: uuidv4(),
      title,
      description,
    };

    room.issues.push(issue);
    await this.update(room);
    return issue;
  },

  async removeIssue(roomId: string, issueId: string): Promise<Room | null> {
    const room = await this.findById(roomId);
    if (!room) return null;

    room.issues = room.issues.filter(i => i.id !== issueId);
    if (room.currentIssue?.id === issueId) {
      room.currentIssue = null;
    }
    await this.update(room);
    return room;
  },

  async updateRole(roomId: string, userId: string, role: Role): Promise<Room | null> {
    const room = await this.findById(roomId);
    if (!room) return null;

    const participant = room.participants.find(p => p.userId === userId);
    if (!participant) return null;

    participant.role = role;
    if (role !== Role.PLAYER) {
      delete room.votes[userId];
      participant.hasVoted = false;

      // Also remove vote from current issue
      if (room.currentIssue?.votes) {
        delete room.currentIssue.votes[userId];
        const issueIndex = room.issues.findIndex(i => i.id === room.currentIssue!.id);
        if (issueIndex >= 0 && room.issues[issueIndex].votes) {
          delete room.issues[issueIndex].votes[userId];
        }
      }
    }
    await this.update(room);
    return room;
  },

  async setTimer(roomId: string, endTime: number | null): Promise<Room | null> {
    const room = await this.findById(roomId);
    if (!room) return null;

    room.timerEndTime = endTime;
    await this.update(room);
    return room;
  },
};
