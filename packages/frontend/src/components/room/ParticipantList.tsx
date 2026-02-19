import { type Participant, Role } from '@planning-poker/shared';
import { Avatar, Button } from '../common';

interface ParticipantListProps {
  participants: Participant[];
  currentUserId?: string;
  isAdmin: boolean;
  onRoleChange?: (userId: string, role: Role) => void;
  onKick?: (userId: string) => void;
}

export function ParticipantList({
  participants,
  currentUserId,
  isAdmin,
  onRoleChange,
  onKick,
}: ParticipantListProps) {
  const connectedParticipants = participants.filter((p) => p.isConnected);

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return 'bg-purple-100 text-purple-700';
      case Role.PLAYER:
        return 'bg-green-100 text-green-700';
      case Role.SPECTATOR:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">
        Participants ({connectedParticipants.length})
      </h3>
      <div className="space-y-2">
        {connectedParticipants.map((participant) => (
          <div
            key={participant.userId}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Avatar
                name={participant.name}
                avatarUrl={participant.avatarUrl}
                color={participant.color}
              />
              <div>
                <p className="font-medium text-gray-800 text-sm">
                  {participant.name}
                  {participant.userId === currentUserId && (
                    <span className="text-gray-400 ml-1">(you)</span>
                  )}
                </p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(
                    participant.role,
                  )}`}
                >
                  {participant.role}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {participant.role === Role.PLAYER && (
                <span
                  className={`w-3 h-3 rounded-full ${
                    participant.hasVoted ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  title={participant.hasVoted ? 'Voted' : 'Not voted'}
                />
              )}

              {isAdmin && participant.role !== Role.ADMIN && (
                <div className="flex gap-1">
                  <select
                    value={participant.role}
                    onChange={(e) => onRoleChange?.(participant.userId, e.target.value as Role)}
                    className="text-xs border rounded px-1 py-0.5"
                  >
                    <option value={Role.PLAYER}>Player</option>
                    <option value={Role.SPECTATOR}>Spectator</option>
                  </select>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => onKick?.(participant.userId)}
                    className="text-xs px-2 py-0.5"
                  >
                    Kick
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
