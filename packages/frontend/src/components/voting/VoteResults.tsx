import type { VotingResults as VotingResultsType } from '@planning-poker/shared';
import { Card } from '../common';

interface VoteResultsProps {
  results: VotingResultsType;
}

export function VoteResults({ results }: VoteResultsProps) {
  const { votes, average, consensus } = results;

  return (
    <Card className="w-full">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Results</h3>

      <div className="flex items-center justify-center gap-8 mb-6">
        <div className="text-center">
          <p className="text-sm text-gray-500">Average</p>
          <p className="text-4xl font-bold text-primary-600">{average}</p>
        </div>
        {consensus && (
          <div className="text-center">
            <p className="text-sm text-gray-500">Consensus</p>
            <p className="text-2xl font-bold text-green-600">Reached!</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {votes.map(({ participant, value }) => (
          <div
            key={participant.userId}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              {participant.avatarUrl ? (
                <img
                  src={participant.avatarUrl}
                  alt={participant.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center">
                  <span className="text-primary-700 font-medium">
                    {participant.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="font-medium text-gray-700">{participant.name}</span>
            </div>
            <span className="text-xl font-bold text-primary-600">{value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
