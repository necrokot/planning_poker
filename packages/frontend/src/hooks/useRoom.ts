import { useEffect, useCallback } from 'react';
import { useRoomStore, useAuthStore } from '../store';
import { socketService } from '../services';
import { FibonacciValue, Issue, Role } from '@planning-poker/shared';

export function useRoom(roomId: string) {
  const {
    room,
    votingResults,
    isConnected,
    error,
    setRoom,
    setVotingResults,
    setConnected,
    setError,
    updateParticipant,
    removeParticipant,
    setVoteSubmitted,
    addIssue,
    removeIssue: removeIssueFromStore,
    setCurrentIssue,
    resetVoting,
  } = useRoomStore();

  const { user } = useAuthStore();

  useEffect(() => {
    const socket = socketService.connect();

    socket.on('connect', () => {
      setConnected(true);
      socketService.joinRoom(roomId);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('room_state', (roomData) => {
      setRoom(roomData);
    });

    socket.on('user_joined', (participant) => {
      updateParticipant(participant);
    });

    socket.on('user_left', (userId) => {
      removeParticipant(userId);
    });

    socket.on('vote_submitted', ({ userId }) => {
      setVoteSubmitted(userId);
    });

    socket.on('votes_revealed', (results) => {
      setVotingResults(results);
    });

    socket.on('voting_reset', () => {
      resetVoting();
    });

    socket.on('issue_changed', (issue) => {
      setCurrentIssue(issue);
    });

    socket.on('issue_added', (issue) => {
      addIssue(issue);
    });

    socket.on('issue_removed', (issueId) => {
      removeIssueFromStore(issueId);
    });

    socket.on('role_updated', ({ userId, role }) => {
      if (room) {
        const participant = room.participants.find((p) => p.userId === userId);
        if (participant) {
          updateParticipant({ ...participant, role });
        }
      }
    });

    socket.on('error', (message) => {
      setError(message);
      setTimeout(() => setError(null), 5000);
    });

    return () => {
      socketService.leaveRoom(roomId);
      socketService.disconnect();
      setRoom(null);
    };
  }, [roomId]);

  const submitVote = useCallback(
    (value: FibonacciValue) => {
      socketService.submitVote(roomId, value);
    },
    [roomId]
  );

  const revealVotes = useCallback(() => {
    socketService.revealVotes(roomId);
  }, [roomId]);

  const resetVotes = useCallback(() => {
    socketService.resetVoting(roomId);
  }, [roomId]);

  const changeIssue = useCallback(
    (issue: Issue) => {
      socketService.changeIssue(roomId, issue);
    },
    [roomId]
  );

  const addNewIssue = useCallback(
    (title: string, description?: string) => {
      socketService.addIssue(roomId, title, description);
    },
    [roomId]
  );

  const removeIssue = useCallback(
    (issueId: string) => {
      socketService.removeIssue(roomId, issueId);
    },
    [roomId]
  );

  const updateRole = useCallback(
    (userId: string, role: Role) => {
      socketService.updateRole(roomId, userId, role);
    },
    [roomId]
  );

  const startTimer = useCallback(
    (duration: number) => {
      socketService.startTimer(roomId, duration);
    },
    [roomId]
  );

  const stopTimer = useCallback(() => {
    socketService.stopTimer(roomId);
  }, [roomId]);

  const kickParticipant = useCallback(
    (userId: string) => {
      socketService.kickParticipant(roomId, userId);
    },
    [roomId]
  );

  const isAdmin = room?.adminId === user?.id;
  const currentParticipant = room?.participants.find((p) => p.userId === user?.id);
  const canVote = currentParticipant?.role === Role.PLAYER && !room?.isRevealed;

  return {
    room,
    votingResults,
    isConnected,
    error,
    isAdmin,
    currentParticipant,
    canVote,
    submitVote,
    revealVotes,
    resetVotes,
    changeIssue,
    addNewIssue,
    removeIssue,
    updateRole,
    startTimer,
    stopTimer,
    kickParticipant,
  };
}
