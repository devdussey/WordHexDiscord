const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';

let authToken: string | null = localStorage.getItem('auth_token');

export const setAuthToken = (token: string) => {
  authToken = token;
  localStorage.setItem('auth_token', token);
};

export const clearAuthToken = () => {
  authToken = null;
  localStorage.removeItem('auth_token');
};

const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
};

export const api = {
  auth: {
    login: (username: string) => fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username }),
    }),
    guest: () => fetchApi('/auth/guest', { method: 'POST' }),
  },

  game: {
    getSessions: () => fetchApi('/game/sessions'),
    createSession: (data: Record<string, unknown>) => fetchApi('/game/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getLeaderboard: () => fetchApi('/game/leaderboard'),
    updateLeaderboard: (data: Record<string, unknown>) => fetchApi('/game/leaderboard', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getServerRecord: () => fetchApi('/game/server-records'),
    createServerRecord: (data: Record<string, unknown>) => fetchApi('/game/server-records', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  lobby: {
    getLobbies: () => fetchApi('/lobby/lobbies'),
    createLobby: (hostId: string, maxPlayers: number) => fetchApi('/lobby/lobbies', {
      method: 'POST',
      body: JSON.stringify({ host_id: hostId, max_players: maxPlayers }),
    }),
    joinLobby: (lobbyId: string, playerId: string, playerName: string) =>
      fetchApi(`/lobby/lobbies/${lobbyId}/join`, {
        method: 'POST',
        body: JSON.stringify({ player_id: playerId, player_name: playerName }),
      }),
    leaveLobby: (lobbyId: string, playerId: string) =>
      fetchApi(`/lobby/lobbies/${lobbyId}/leave`, {
        method: 'POST',
        body: JSON.stringify({ player_id: playerId }),
      }),
    getPlayers: (lobbyId: string) => fetchApi(`/lobby/lobbies/${lobbyId}/players`),
  },
};

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<(data: Record<string, unknown>) => void>>();

  connect(userId: string, username: string) {
    if (this.ws) return;

    try {
      this.ws = new WebSocket(WS_URL);
    } catch (error) {
      console.warn('WebSocket not available:', error);
      return;
    }

    this.ws.onopen = () => {
      this.send({ type: 'auth', userId, username });
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const handlers = this.handlers.get(message.type);
      if (handlers) {
        handlers.forEach(handler => handler(message));
      }
    };

    this.ws.onclose = () => {
      this.ws = null;
      setTimeout(() => this.connect(userId, username), 3000);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: Record<string, unknown>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  on(type: string, handler: (data: Record<string, unknown>) => void) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
  }

  off(type: string, handler: (data: Record<string, unknown>) => void) {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }
}

export const wsClient = new WebSocketClient();
