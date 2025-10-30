import type {
  AuthResponse,
  GameSession,
  LobbyMaybeResponse,
  LobbyResponse,
  LobbySummary,
  LobbyStartResponse,
  LogsResponse,
  MatchHistoryEntry,
  MatchRecordResponse,
  MatchmakingJoinResponse,
  MatchmakingSnapshot,
  PlayerStatsResponse,
  LeaderboardEntry,
  ServerRecord,
  SessionResponse,
  SuccessResponse,
  RealtimeMessage,
} from '../types/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const WS_BASE =
  import.meta.env.VITE_WS_URL ||
  API_BASE.replace(/^http/i, (match) => (match.toLowerCase() === 'https' ? 'wss' : 'ws')).replace(
    /\/api\/?$/,
    '/ws'
  );

let authToken: string | null = localStorage.getItem('wordhex_token');

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) {
    return {};
  }
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return { ...headers };
}

function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...normalizeHeaders(options.headers),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  }).then(async (response) => {
    const contentType = response.headers.get('content-type');
    const isJson = Boolean(contentType && contentType.includes('application/json'));
    const body: unknown = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message =
        typeof body === 'string'
          ? body
          : (typeof body === 'object' && body !== null && 'error' in body
              ? String((body as Record<string, unknown>).error)
              : response.statusText);
      throw new Error(message);
    }

    return body as T;
  });
}

export const api = {
  auth: {
    async register(identity: { discordId?: string; username: string }) {
      const result = await request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(identity),
      });
      authToken = result.token;
      localStorage.setItem('wordhex_token', result.token);
      return result;
    },
    async guest() {
      const result = await request<AuthResponse>('/auth/guest', { method: 'POST' });
      authToken = result.token;
      localStorage.setItem('wordhex_token', result.token);
      return result;
    },
    clearToken() {
      authToken = null;
      localStorage.removeItem('wordhex_token');
    },
  },

  lobby: {
    create(payload: { hostId: string; username: string; serverId?: string }) {
      return request<LobbyResponse>('/lobby/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    join(payload: { code?: string; lobbyId?: string; userId: string; username: string }) {
      return request<LobbyResponse>('/lobby/join', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    get(lobbyId: string) {
      return request<LobbySummary>(`/lobby/${lobbyId}`, { method: 'GET' });
    },
    ready(payload: { lobbyId: string; userId: string; ready: boolean }) {
      return request<LobbyResponse>('/lobby/ready', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    leave(payload: { lobbyId: string; userId: string }) {
      return request<LobbyMaybeResponse>('/lobby/leave', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    start(payload: { lobbyId: string }) {
      return request<LobbyStartResponse>('/lobby/start', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },

  matchmaking: {
    join(payload: { userId: string; username: string; serverId?: string }) {
      return request<MatchmakingJoinResponse>('/matchmaking/join', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    leave(payload: { userId: string }) {
      return request<SuccessResponse>('/matchmaking/leave', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    snapshot() {
      return request<MatchmakingSnapshot>('/matchmaking/snapshot', { method: 'GET' });
    },
  },

  game: {
    createSession(payload: { userId: string; playerName: string; serverId?: string; channelId?: string }) {
      return request<SessionResponse>('/game/sessions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    completeSession(sessionId: string, payload: { score: number }) {
      return request<SessionResponse>(`/game/sessions/${sessionId}/complete`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    recordMatch(payload: {
      matchId?: string;
      lobbyId?: string;
      players: { id: string; username: string; score: number; wordsFound?: string[] }[];
      gridData?: unknown;
      wordsFound?: unknown[];
    }) {
      return request<MatchRecordResponse>('/game/matches', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    activeSessions(serverId: string) {
      const params = new URLSearchParams({ serverId });
      return request<GameSession[]>(`/sessions/active?${params.toString()}`, { method: 'GET' });
    },
  },

  stats: {
    leaderboard(limit = 10) {
      const params = new URLSearchParams({ limit: String(limit) });
      return request<LeaderboardEntry[]>(`/leaderboard?${params.toString()}`, { method: 'GET' });
    },
    player(userId: string) {
      return request<PlayerStatsResponse>(`/stats/${userId}`, { method: 'GET' });
    },
    matches(userId: string, limit = 20) {
      const params = new URLSearchParams({ limit: String(limit) });
      return request<MatchHistoryEntry[]>(`/matches/${userId}?${params.toString()}`, {
        method: 'GET',
      });
    },
    serverRecord(serverId: string) {
      const params = new URLSearchParams({ serverId });
      return request<ServerRecord | null>(`/server-records?${params.toString()}`, { method: 'GET' });
    },
    updateServerRecord(payload: {
      serverId: string;
      userId: string;
      username: string;
      score: number;
      wordsFound?: number;
      gemsCollected?: number;
    }) {
      return request<ServerRecord>('/server-records', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },

  logs: {
    client(payload: Record<string, unknown>) {
      return request<LogsResponse>('/logs', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },
};

type MessageHandler = (payload: RealtimeMessage) => void;

class RealtimeClient {
  private ws: WebSocket | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private channelHandlers = new Map<string, Set<MessageHandler>>();
  private identifyPayload: { userId: string; username: string } | null = null;

  connect(userId: string, username: string) {
    this.identifyPayload = { userId, username };
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.identify();
      return;
    }
    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      return;
    }
    this.ws = new WebSocket(WS_BASE);
    this.ws.onopen = () => {
      this.identify();
      this.resubscribeAll();
    };
    this.ws.onclose = () => {
      this.ws = null;
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
      this.reconnectTimeout = setTimeout(() => {
        if (this.identifyPayload) {
          this.connect(this.identifyPayload.userId, this.identifyPayload.username);
        }
      }, 2000);
    };
    this.ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as RealtimeMessage;
        const { channel } = payload;
        if (!channel) {
          return;
        }
        const handlers = this.channelHandlers.get(channel);
        if (handlers) {
          handlers.forEach((handler) => handler(payload));
        }
      } catch (error) {
        console.warn('Failed to parse realtime message', error);
      }
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  subscribe(channel: string, handler: MessageHandler) {
    if (!this.channelHandlers.has(channel)) {
      this.channelHandlers.set(channel, new Set());
    }
    this.channelHandlers.get(channel)!.add(handler);
    this.send({ type: 'subscribe', channel });
  }

  unsubscribe(channel: string, handler?: MessageHandler) {
    const handlers = this.channelHandlers.get(channel);
    if (!handlers) return;
    if (handler) {
      handlers.delete(handler);
    } else {
      handlers.clear();
    }
    if (handlers.size === 0) {
      this.channelHandlers.delete(channel);
      this.send({ type: 'unsubscribe', channel });
    }
  }

  private identify() {
    if (this.identifyPayload) {
      this.send({ type: 'identify', ...this.identifyPayload });
    }
  }

  private resubscribeAll() {
    this.channelHandlers.forEach((_handlers, channel) => {
      this.send({ type: 'subscribe', channel });
    });
  }

  private send(payload: Record<string, unknown>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }
}

export const realtime = new RealtimeClient();
