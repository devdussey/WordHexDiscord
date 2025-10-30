export interface PlayerStatsSummary {
  totalMatches: number;
  totalWins: number;
  totalScore: number;
  totalWords: number;
  bestScore: number;
  winStreak: number;
  bestWinStreak: number;
  updatedAt: string;
}

export interface ApiUser {
  id: string;
  discordId: string | null;
  username: string;
  coins: number;
  gems: number;
  cosmetics: string[];
  createdAt: string;
  updatedAt: string;
  stats?: PlayerStatsSummary;
}

export interface AuthResponse {
  token: string;
  user: ApiUser;
}

export interface LobbyPlayer {
  userId: string;
  username: string;
  ready: boolean;
  isHost: boolean;
  joinedAt: string;
}

export type LobbyStatus = 'waiting' | 'playing' | 'finished';

export interface LobbySummary {
  id: string;
  code: string;
  serverId: string;
  hostId: string;
  status: LobbyStatus;
  createdAt: string;
  updatedAt: string;
  players: LobbyPlayer[];
  matchId: string | null;
}

export interface MatchPlayerSummary {
  userId: string;
  username: string;
  score: number;
  wordsFound: string[];
  rank: number | null;
}

export type MatchStatus = 'in_progress' | 'completed';

export interface MatchSummary {
  id: string;
  lobbyId: string | null;
  status: MatchStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  players: MatchPlayerSummary[];
  gridData?: unknown;
  wordsFound?: string[];
}

export interface LobbyResponse {
  lobby: LobbySummary;
}

export interface LobbyMaybeResponse {
  lobby: LobbySummary | null;
}

export interface GameSession {
  id: string;
  userId: string;
  playerName: string;
  serverId: string;
  channelId: string | null;
  status: 'active' | 'completed';
  score: number;
  roundNumber: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface SessionResponse {
  session: GameSession;
}

export interface MatchRecordResponse {
  match: MatchSummary;
}

export interface LobbyStartResponse {
  lobby: LobbySummary;
  match: MatchSummary;
}

export interface MatchmakingQueued {
  status: 'queued';
  queuePosition: number;
  playersInQueue: number;
}

export interface MatchmakingMatched {
  status: 'matched';
  lobby: LobbySummary;
}

export type MatchmakingJoinResponse = MatchmakingQueued | MatchmakingMatched;

export interface MatchmakingSnapshotEntry {
  userId: string;
  username: string;
  serverId: string;
  joinedAt: number;
}

export interface MatchmakingSnapshot {
  queueSize: number;
  entries: MatchmakingSnapshotEntry[];
}

export interface LeaderboardEntry extends PlayerStatsSummary {
  userId: string;
  username: string;
  coins: number;
  gems: number;
}

export interface PlayerStatsResponse extends PlayerStatsSummary {
  userId: string;
  username: string;
  coins: number;
  gems: number;
}

export type MatchHistoryEntry = MatchSummary;

export interface ServerRecord {
  serverId: string;
  userId: string;
  username: string;
  score: number;
  wordsFound?: number;
  gemsCollected?: number;
  achievedAt: string;
  updatedAt: string;
}

export interface SuccessResponse {
  success: boolean;
}

export interface LogsResponse {
  ok: boolean;
}


export interface RealtimeMessage {
  channel: string;
  type?: string;
  [key: string]: unknown;
}
