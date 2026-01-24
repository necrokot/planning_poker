import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card, Spinner } from '../components/common';
import { useAuth } from '../hooks';
import { api } from '../services';
import { RoomSummary } from '@planning-poker/shared';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newRoomName, setNewRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinRoomId, setJoinRoomId] = useState('');

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const { rooms } = await api.rooms.getAll();
      setRooms(rooms);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const { room } = await api.rooms.create(newRoomName.trim());
      setNewRoomName('');
      navigate(`/room/${room.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = () => {
    if (joinRoomId.trim()) {
      navigate(`/room/${joinRoomId.trim()}`);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await api.rooms.delete(roomId);
      setRooms(rooms.filter((r) => r.id !== roomId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete room');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Planning Poker</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center">
                  <span className="text-primary-700 font-medium">
                    {user?.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-gray-700">{user?.name}</span>
            </div>
            <Button variant="secondary" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Create New Room</h2>
            <div className="space-y-3">
              <Input
                placeholder="Room name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
              />
              <Button
                onClick={handleCreateRoom}
                disabled={!newRoomName.trim() || isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Room'}
              </Button>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <p className="text-gray-500 text-sm">
                You can have up to 3 active rooms at a time.
              </p>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Join a Room</h2>
            <div className="space-y-3">
              <Input
                placeholder="Room ID"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
              <Button onClick={handleJoinRoom} disabled={!joinRoomId.trim()}>
                Join Room
              </Button>
            </div>
          </Card>
        </div>

        <Card className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Rooms</h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : rooms.length === 0 ? (
            <p className="text-gray-500">You haven't created any rooms yet.</p>
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium text-gray-800">{room.name}</h3>
                    <p className="text-sm text-gray-500">
                      {room.participantCount} participant(s)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => navigate(`/room/${room.id}`)}>
                      Open
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${window.location.origin}/room/${room.id}`
                        );
                      }}
                    >
                      Copy Link
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteRoom(room.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
