// User types
export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPublic {
  id: string;
  name: string;
  avatarUrl: string | null;
}

// Role types
export enum Role {
  ADMIN = 'admin',
  PLAYER = 'player',
  SPECTATOR = 'spectator',
}

// Participant in a room
export interface Participant {
  userId: string;
  name: string;
  avatarUrl: string | null;
  role: Role;
  hasVoted: boolean;
  isConnected: boolean;
}

// Vote value - Fibonacci sequence
export const FIBONACCI_VALUES = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55] as const;
export type FibonacciValue = (typeof FIBONACCI_VALUES)[number];

// Vote
export interface Vote {
  userId: string;
  value: FibonacciValue;
  timestamp: number;
}

// Issue to vote on
export interface Issue {
  id: string;
  title: string;
  description?: string;
  finalEstimate?: FibonacciValue;
}

// Room state
export interface Room {
  id: string;
  name: string;
  adminId: string;
  currentIssue: Issue | null;
  participants: Participant[];
  votes: Record<string, FibonacciValue>;
  issues: Issue[];
  isVotingOpen: boolean;
  isRevealed: boolean;
  timerEndTime: number | null;
  createdAt: number;
}

// Room summary for listing
export interface RoomSummary {
  id: string;
  name: string;
  participantCount: number;
  createdAt: number;
}

// Voting results
export interface VotingResults {
  votes: Array<{
    participant: Participant;
    value: FibonacciValue;
  }>;
  average: number;
  consensus: boolean;
}

// Socket.io event types

// Client to Server events
export interface ClientToServerEvents {
  join_room: (data: { roomId: string }) => void;
  leave_room: (data: { roomId: string }) => void;
  submit_vote: (data: { roomId: string; value: FibonacciValue }) => void;
  reveal_votes: (data: { roomId: string }) => void;
  reset_voting: (data: { roomId: string }) => void;
  change_issue: (data: { roomId: string; issue: Issue }) => void;
  add_issue: (data: { roomId: string; title: string; description?: string }) => void;
  remove_issue: (data: { roomId: string; issueId: string }) => void;
  update_role: (data: { roomId: string; userId: string; role: Role }) => void;
  start_timer: (data: { roomId: string; duration: number }) => void;
  stop_timer: (data: { roomId: string }) => void;
  kick_participant: (data: { roomId: string; userId: string }) => void;
}

// Server to Client events
export interface ServerToClientEvents {
  room_state: (room: Room) => void;
  vote_submitted: (data: { userId: string }) => void;
  votes_revealed: (results: VotingResults) => void;
  voting_reset: () => void;
  issue_changed: (issue: Issue | null) => void;
  issue_added: (issue: Issue) => void;
  issue_removed: (issueId: string) => void;
  user_joined: (participant: Participant) => void;
  user_left: (userId: string) => void;
  role_updated: (data: { userId: string; role: Role }) => void;
  timer_started: (endTime: number) => void;
  timer_stopped: () => void;
  participant_kicked: (userId: string) => void;
  error: (message: string) => void;
}

// API types
export interface CreateRoomRequest {
  name: string;
}

export interface CreateRoomResponse {
  room: RoomSummary;
}

export interface GetRoomsResponse {
  rooms: RoomSummary[];
}

export interface ApiError {
  message: string;
  code?: string;
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface AuthResponse {
  user: AuthUser;
}
