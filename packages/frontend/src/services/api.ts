import type {
  AuthResponse,
  CreateRoomResponse,
  GetRoomsResponse,
  RoomSummary,
} from '@planning-poker/shared';

const API_BASE = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  return response.json();
}

export const api = {
  auth: {
    async getMe(): Promise<AuthResponse> {
      const response = await fetch(`${API_BASE}/auth/me`, {
        credentials: 'include',
      });
      return handleResponse<AuthResponse>(response);
    },

    async logout(): Promise<void> {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    },

    getGoogleAuthUrl(): string {
      return `${API_BASE}/auth/google`;
    },

    async getDevStatus(): Promise<{ available: boolean }> {
      try {
        const response = await fetch(`${API_BASE}/auth/dev-status`, {
          credentials: 'include',
        });
        return handleResponse<{ available: boolean }>(response);
      } catch {
        return { available: false };
      }
    },

    async devLogin(): Promise<AuthResponse> {
      const response = await fetch(`${API_BASE}/auth/dev-login`, {
        method: 'POST',
        credentials: 'include',
      });
      return handleResponse<AuthResponse>(response);
    },

    async dev1Login(): Promise<AuthResponse> {
      const response = await fetch(`${API_BASE}/auth/dev1-login`, {
        method: 'POST',
        credentials: 'include',
      });
      return handleResponse<AuthResponse>(response);
    },

    async dev2Login(): Promise<AuthResponse> {
      const response = await fetch(`${API_BASE}/auth/dev2-login`, {
        method: 'POST',
        credentials: 'include',
      });
      return handleResponse<AuthResponse>(response);
    },
  },

  rooms: {
    async create(name: string): Promise<CreateRoomResponse> {
      const response = await fetch(`${API_BASE}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
      });
      return handleResponse<CreateRoomResponse>(response);
    },

    async getAll(): Promise<GetRoomsResponse> {
      const response = await fetch(`${API_BASE}/rooms`, {
        credentials: 'include',
      });
      return handleResponse<GetRoomsResponse>(response);
    },

    async get(roomId: string): Promise<{ room: RoomSummary }> {
      const response = await fetch(`${API_BASE}/rooms/${roomId}`, {
        credentials: 'include',
      });
      return handleResponse<{ room: RoomSummary }>(response);
    },

    async delete(roomId: string): Promise<void> {
      const response = await fetch(`${API_BASE}/rooms/${roomId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Delete failed' }));
        throw new Error(error.message);
      }
    },
  },
};
