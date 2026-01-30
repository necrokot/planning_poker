import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useRoom } from '../hooks';
import { useAuthStore } from '../store';
import { Spinner, Card, Button } from '../components/common';
import { ParticipantList, IssueBacklog, AdminPanel, Timer } from '../components/room';
import { VotingCards, VoteResults } from '../components/voting';
import { FibonacciValue, Role } from '@planning-poker/shared';

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuthStore();
  const [selectedVote, setSelectedVote] = useState<FibonacciValue | undefined>();

  const {
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
  } = useRoom(roomId!);

  const handleVote = (value: FibonacciValue) => {
    setSelectedVote(value);
    submitVote(value);
  };

  const handleReset = () => {
    setSelectedVote(undefined);
    resetVotes();
  };

  if (!isConnected || !room) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          {error ? (
            <>
              <div className="bg-red-100 text-red-700 px-6 py-4 rounded-lg mb-4">
                {error}
              </div>
              <Link
                to="/dashboard"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                &larr; Back to Dashboard
              </Link>
            </>
          ) : (
            <>
              <Spinner size="lg" />
              <p className="mt-4 text-gray-600">Connecting to room...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link
                to="/dashboard"
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                &larr; Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-800">{room.name}</h1>
            </div>
            <div className="flex items-center gap-4">
              <Timer endTime={room.timerEndTime} />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                }}
              >
                Copy Link
              </Button>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg">{error}</div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {room.currentIssue ? (
              <Card>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Current Issue
                </h2>
                <p className="text-lg text-gray-700">{room.currentIssue.title}</p>
                {room.currentIssue.description && (
                  <p className="text-gray-500 mt-1">{room.currentIssue.description}</p>
                )}
              </Card>
            ) : (
              <Card>
                <p className="text-gray-500 text-center py-4">
                  No issue selected. {isAdmin ? 'Select an issue from the backlog.' : 'Waiting for admin to select an issue.'}
                </p>
              </Card>
            )}

            {votingResults ? (
              <VoteResults results={votingResults} />
            ) : (
              <Card>
                <VotingCards
                  onVote={handleVote}
                  disabled={!canVote || currentParticipant?.hasVoted}
                  selectedValue={selectedVote}
                  hasVoted={currentParticipant?.hasVoted}
                />
                {currentParticipant?.role === Role.SPECTATOR && (
                  <p className="text-center text-gray-500 mt-4">
                    You are a spectator. Ask the admin to change your role to vote.
                  </p>
                )}
              </Card>
            )}

            {isAdmin && (
              <AdminPanel
                isVotingRevealed={!!votingResults}
                hasVotes={Object.keys(room.votes).length > 0}
                onReveal={revealVotes}
                onReset={handleReset}
                onStartTimer={startTimer}
                onStopTimer={stopTimer}
                timerActive={!!room.timerEndTime && room.timerEndTime > Date.now()}
              />
            )}
          </div>

          <div className="space-y-6">
            <ParticipantList
              participants={room.participants}
              currentUserId={user?.id}
              isAdmin={isAdmin}
              onRoleChange={updateRole}
              onKick={kickParticipant}
            />

            <IssueBacklog
              issues={room.issues}
              currentIssue={room.currentIssue}
              isAdmin={isAdmin}
              onSelectIssue={changeIssue}
              onAddIssue={addNewIssue}
              onRemoveIssue={removeIssue}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
