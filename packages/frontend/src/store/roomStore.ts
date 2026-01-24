import { create } from 'zustand';
import { Room, Participant, Issue, VotingResults } from '@planning-poker/shared';

interface RoomState {
  room: Room | null;
  votingResults: VotingResults | null;
  isConnected: boolean;
  error: string | null;
  setRoom: (room: Room | null) => void;
  setVotingResults: (results: VotingResults | null) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  updateParticipant: (participant: Participant) => void;
  removeParticipant: (userId: string) => void;
  setVoteSubmitted: (userId: string) => void;
  addIssue: (issue: Issue) => void;
  removeIssue: (issueId: string) => void;
  setCurrentIssue: (issue: Issue | null) => void;
  resetVoting: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  room: null,
  votingResults: null,
  isConnected: false,
  error: null,
  setRoom: (room) => set({ room, votingResults: null }),
  setVotingResults: (votingResults) => set({ votingResults }),
  setConnected: (isConnected) => set({ isConnected }),
  setError: (error) => set({ error }),
  updateParticipant: (participant) =>
    set((state) => {
      if (!state.room) return state;
      const participants = state.room.participants.map((p) =>
        p.userId === participant.userId ? participant : p
      );
      if (!participants.find((p) => p.userId === participant.userId)) {
        participants.push(participant);
      }
      return { room: { ...state.room, participants } };
    }),
  removeParticipant: (userId) =>
    set((state) => {
      if (!state.room) return state;
      const participant = state.room.participants.find((p) => p.userId === userId);
      if (participant) {
        participant.isConnected = false;
      }
      return { room: { ...state.room } };
    }),
  setVoteSubmitted: (userId) =>
    set((state) => {
      if (!state.room) return state;
      const participants = state.room.participants.map((p) =>
        p.userId === userId ? { ...p, hasVoted: true } : p
      );
      return { room: { ...state.room, participants } };
    }),
  addIssue: (issue) =>
    set((state) => {
      if (!state.room) return state;
      return { room: { ...state.room, issues: [...state.room.issues, issue] } };
    }),
  removeIssue: (issueId) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          issues: state.room.issues.filter((i) => i.id !== issueId),
        },
      };
    }),
  setCurrentIssue: (issue) =>
    set((state) => {
      if (!state.room) return state;
      return { room: { ...state.room, currentIssue: issue } };
    }),
  resetVoting: () =>
    set((state) => {
      if (!state.room) return state;
      const participants = state.room.participants.map((p) => ({
        ...p,
        hasVoted: false,
      }));
      return {
        room: {
          ...state.room,
          participants,
          votes: {},
          isRevealed: false,
          isVotingOpen: true,
        },
        votingResults: null,
      };
    }),
}));
