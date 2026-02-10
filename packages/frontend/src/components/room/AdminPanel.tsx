import { Button } from '../common';

interface AdminPanelProps {
  isVotingRevealed: boolean;
  hasVotes: boolean;
  onReveal: () => void;
  onReset: () => void;
  onStartTimer: (seconds: number) => void;
  onStopTimer: () => void;
  timerActive: boolean;
}

export function AdminPanel({
  isVotingRevealed,
  hasVotes,
  onReveal,
  onReset,
  onStartTimer,
  onStopTimer,
  timerActive,
}: AdminPanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">Admin Controls</h3>

      <div className="flex flex-wrap gap-2">
        {!isVotingRevealed ? (
          <Button onClick={onReveal} disabled={!hasVotes}>
            Reveal Votes
          </Button>
        ) : (
          <Button onClick={onReset} variant="secondary">
            New Round
          </Button>
        )}

        {!timerActive ? (
          <div className="flex gap-1">
            <Button onClick={() => onStartTimer(30)} variant="secondary" size="sm">
              30s
            </Button>
            <Button onClick={() => onStartTimer(60)} variant="secondary" size="sm">
              1m
            </Button>
            <Button onClick={() => onStartTimer(120)} variant="secondary" size="sm">
              2m
            </Button>
          </div>
        ) : (
          <Button onClick={onStopTimer} variant="danger" size="sm">
            Stop Timer
          </Button>
        )}
      </div>
    </div>
  );
}
