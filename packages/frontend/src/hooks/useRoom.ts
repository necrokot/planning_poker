import {
  type FibonacciValue,
  type Issue,
  type Participant,
  Role,
  type Room,
  type VotingResults,
} from '@planning-poker/shared';
import { useCallback, useEffect } from 'react';
import { socketService } from '../services';
import { useAuthStore, useRoomStore } from '../store';

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
    console.log('[useRoom] Effect running for room:', roomId);

    // Clear previous room state when entering a new room
    setRoom(null);
    setError(null);
    setVotingResults(null);

    const socket = socketService.connect();

    // Set connected state based on actual socket state
    setConnected(socket.connected);
    console.log('[useRoom] Socket connected state:', socket.connected);

    const handleConnect = () => {
      console.log('[useRoom] Socket connected, joining room');
      setConnected(true);
      socketService.joinRoom(roomId);
    };

    const handleConnectError = (err: Error) => {
      setError(err.message || 'Connection failed');
    };

    const handleDisconnect = (reason: string) => {
      console.log('[useRoom] Socket disconnected, reason:', reason);
      setConnected(false);
    };

    const handleRoomState = (roomData: Room) => {
      console.log('[useRoom] Received room_state:', roomData.id);
      setRoom(roomData);
    };

    const handleUserJoined = (participant: Participant) => {
      updateParticipant(participant);
    };

    const handleUserLeft = (leftUserId: string) => {
      removeParticipant(leftUserId);
    };

    const handleVoteSubmitted = ({ userId: oderId }: { userId: string }) => {
      setVoteSubmitted(oderId);
    };

    const handleVotesRevealed = (results: VotingResults) => {
      setVotingResults(results);
    };

    const handleVotingReset = () => {
      resetVoting();
    };

    const handleIssueChanged = (issue: Issue | null) => {
      setCurrentIssue(issue);
    };

    const handleIssueAdded = (issue: Issue) => {
      addIssue(issue);
    };

    const handleIssueRemoved = (issueId: string) => {
      removeIssueFromStore(issueId);
    };

    const handleRoleUpdated = ({ userId: oderId, role }: { userId: string; role: Role }) => {
      const currentRoom = useRoomStore.getState().room;
      if (currentRoom) {
        const participant = currentRoom.participants.find((p) => p.userId === oderId);
        if (participant) {
          updateParticipant({ ...participant, role });
        }
      }
    };

    const handleError = (message: string) => {
      setError(message);
      // Only auto-clear errors if room is already loaded (transient errors)
      // Fatal errors like "room not found" should persist
      if (useRoomStore.getState().room) {
        setTimeout(() => setError(null), 5000);
      }
    };

    // Set up all listeners first
    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);
    socket.on('disconnect', handleDisconnect);
    socket.on('room_state', handleRoomState);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('vote_submitted', handleVoteSubmitted);
    socket.on('votes_revealed', handleVotesRevealed);
    socket.on('voting_reset', handleVotingReset);
    socket.on('issue_changed', handleIssueChanged);
    socket.on('issue_added', handleIssueAdded);
    socket.on('issue_removed', handleIssueRemoved);
    socket.on('role_updated', handleRoleUpdated);
    socket.on('error', handleError);

    // If socket is already connected, join immediately (after listeners are set up)
    if (socket.connected) {
      console.log('[useRoom] Socket already connected, joining room immediately');
      setConnected(true);
      socketService.joinRoom(roomId);
    }

    return () => {
      console.log('[useRoom] Cleanup running for room:', roomId);
      // Remove all listeners to prevent stacking
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socket.off('disconnect', handleDisconnect);
      socket.off('room_state', handleRoomState);
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
      socket.off('vote_submitted', handleVoteSubmitted);
      socket.off('votes_revealed', handleVotesRevealed);
      socket.off('voting_reset', handleVotingReset);
      socket.off('issue_changed', handleIssueChanged);
      socket.off('issue_added', handleIssueAdded);
      socket.off('issue_removed', handleIssueRemoved);
      socket.off('role_updated', handleRoleUpdated);
      socket.off('error', handleError);

      socketService.leaveRoom(roomId);
      // Don't disconnect - socket can be reused. It will be disconnected on logout.
      setRoom(null);
      setError(null);
    };
  }, [
    roomId,
    addIssue,
    removeIssueFromStore,
    removeParticipant,
    resetVoting, // Set connected state based on actual socket state
    setConnected,
    setCurrentIssue,
    setError, // Clear previous room state when entering a new room
    setRoom,
    setVoteSubmitted,
    setVotingResults,
    updateParticipant,
  ]);

  const submitVote = useCallback(
    (value: FibonacciValue) => {
      socketService.submitVote(roomId, value);
    },
    [roomId],
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
    [roomId],
  );

  const addNewIssue = useCallback(
    (title: string, description?: string) => {
      socketService.addIssue(roomId, title, description);
    },
    [roomId],
  );

  const removeIssue = useCallback(
    (issueId: string) => {
      socketService.removeIssue(roomId, issueId);
    },
    [roomId],
  );

  const updateRole = useCallback(
    (userId: string, role: Role) => {
      socketService.updateRole(roomId, userId, role);
    },
    [roomId],
  );

  const startTimer = useCallback(
    (duration: number) => {
      socketService.startTimer(roomId, duration);
    },
    [roomId],
  );

  const stopTimer = useCallback(() => {
    socketService.stopTimer(roomId);
  }, [roomId]);

  const kickParticipant = useCallback(
    (userId: string) => {
      socketService.kickParticipant(roomId, userId);
    },
    [roomId],
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
