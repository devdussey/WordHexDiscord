export interface MockUser {
  id: string;
  username: string;
  discord_id?: string;
  password_hash?: string;
  coins: number;
  gems: number;
  cosmetics: string[];
  created_at: string;
}

export interface MockPlayerStats {
  user_id: string;
  total_matches: number;
  total_wins: number;
  total_score: number;
  total_words: number;
  best_score: number;
  win_streak: number;
  best_win_streak: number;
}

export interface MockGameSession {
  id: string;
  server_id: string;
  player_name: string;
  player_avatar_url?: string;
  score: number;
  round_number: number;
  game_status: 'active' | 'finished';
  created_at: string;
}

export interface MockLobby {
  id: string;
  lobby_code: string;
  status: 'waiting' | 'playing' | 'finished';
  host_id: string;
  created_at: string;
}

export interface MockLobbyPlayer {
  id: string;
  lobby_id: string;
  user_id: string;
  player_name: string;
  is_ready: boolean;
  joined_at: string;
}

export interface MockMatch {
  id: string;
  created_at: string;
  winner_id?: string;
  duration_seconds: number;
}

export interface MockMatchPlayer {
  id: string;
  match_id: string;
  user_id: string;
  score: number;
  words_found: number;
  created_at: string;
}

export interface MockMatchmakingEntry {
  id: string;
  user_id: string;
  server_id: string;
  searching_since: string;
}

interface MockDatabase {
  users: MockUser[];
  player_stats: MockPlayerStats[];
  game_sessions: MockGameSession[];
  lobbies: MockLobby[];
  lobby_players: MockLobbyPlayer[];
  matches: MockMatch[];
  match_players: MockMatchPlayer[];
  matchmaking_queue: MockMatchmakingEntry[];
  error_logs: Array<Record<string, unknown>>;
}

const now = () => new Date().toISOString();

export const mockDatabase: MockDatabase = {
  users: [
    {
      id: 'guest-0001',
      username: 'Dussey',
      discord_id: '331958570201513987',
      password_hash: 'b760a0cb11c0350b86f0f1fcf3dfbb92a7d62ae8ab45079b864d4866bad47f7a', // SHA-256 of Allycat1!
      coins: 500,
      gems: 40,
      cosmetics: ['default'],
      created_at: now(),
    },
    {
      id: 'guest-0002',
      username: 'Lily',
      discord_id: '1209565744019279974',
      password_hash: 'b760a0cb11c0350b86f0f1fcf3dfbb92a7d62ae8ab45079b864d4866bad47f7a',
      coins: 450,
      gems: 30,
      cosmetics: ['default'],
      created_at: now(),
    },
  ],
  player_stats: [
    {
      user_id: 'guest-0001',
      total_matches: 12,
      total_wins: 7,
      total_score: 1840,
      total_words: 236,
      best_score: 420,
      win_streak: 2,
      best_win_streak: 4,
    },
    {
      user_id: 'guest-0002',
      total_matches: 8,
      total_wins: 3,
      total_score: 1230,
      total_words: 172,
      best_score: 310,
      win_streak: 1,
      best_win_streak: 2,
    },
  ],
  game_sessions: [
    {
      id: 'session-1001',
      server_id: 'dev-server-123',
      player_name: 'Dussey',
      player_avatar_url: undefined,
      score: 320,
      round_number: 3,
      game_status: 'active',
      created_at: now(),
    },
  ],
  lobbies: [
    {
      id: 'lobby-1001',
      lobby_code: '4821',
      status: 'waiting',
      host_id: 'guest-0001',
      created_at: now(),
    },
  ],
  lobby_players: [
    {
      id: 'lobby-player-1',
      lobby_id: 'lobby-1001',
      user_id: 'guest-0001',
      player_name: 'Dussey',
      is_ready: true,
      joined_at: now(),
    },
  ],
  matches: [
    {
      id: 'match-1001',
      created_at: now(),
      winner_id: 'guest-0001',
      duration_seconds: 420,
    },
  ],
  match_players: [
    {
      id: 'match-player-1',
      match_id: 'match-1001',
      user_id: 'guest-0001',
      score: 400,
      words_found: 58,
      created_at: now(),
    },
    {
      id: 'match-player-2',
      match_id: 'match-1001',
      user_id: 'guest-0002',
      score: 320,
      words_found: 47,
      created_at: now(),
    },
  ],
  matchmaking_queue: [],
  error_logs: [],
};

export type MockTable = keyof MockDatabase;

export function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
