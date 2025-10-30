import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';

const events = new EventEmitter();

const state = {
  users: new Map(), // userId -> user
  lobbies: new Map(), // lobbyId -> lobby
  sessions: new Map(), // sessionId -> session
  matches: new Map(), // matchId -> match
  matchmakingQueue: [], // [{ userId, username, serverId, joinedAt }]
  serverRecords: new Map(), // serverId -> record
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
};

const sanitizeLobby = (lobby) => {
  if (!lobby) return null;
  return {
    id: lobby.id,
    code: lobby.code,
    serverId: lobby.serverId,
    hostId: lobby.hostId,
    status: lobby.status,
    createdAt: lobby.createdAt,
    updatedAt: lobby.updatedAt,
    players: lobby.players.map((player) => ({
      userId: player.userId,
      username: player.username,
      ready: player.ready,
      isHost: player.isHost,
      joinedAt: player.joinedAt,
    })),
    matchId: lobby.matchId ?? null,
  };
};

const sanitizeSession = (session) => {
  if (!session) return null;
  return { ...session };
};

const sanitizeMatch = (match) => {
  if (!match) return null;
  return { ...match, players: match.players.map((p) => ({ ...p })) };
};

function getOrCreateUserStats(userId) {
  const user = state.users.get(userId);
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }
  if (!user.stats) {
    user.stats = {
      totalMatches: 0,
      totalWins: 0,
      totalScore: 0,
      totalWords: 0,
      bestScore: 0,
      winStreak: 0,
      bestWinStreak: 0,
      updatedAt: new Date().toISOString(),
    };
  }
  return user.stats;
}

function generateLobbyCode() {
  let code;
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString();
  } while (Array.from(state.lobbies.values()).some((lobby) => lobby.code === code));
  return code;
}

export function onStateEvent(eventName, listener) {
  events.on(eventName, listener);
  return () => events.off(eventName, listener);
}

export function upsertUser({ discordId, username }) {
  const now = new Date().toISOString();
  let existing = null;
  if (discordId) {
    existing = Array.from(state.users.values()).find((user) => user.discordId === discordId);
  }
  if (!existing && username) {
    existing = Array.from(state.users.values()).find(
      (user) => user.discordId == null && user.username.toLowerCase() === username.toLowerCase()
    );
  }

  if (existing) {
    existing.username = username || existing.username;
    existing.updatedAt = now;
    return sanitizeUser(existing);
  }

  const id = discordId || randomUUID();
  const user = {
    id,
    discordId: discordId ?? null,
    username: username || `Player-${id.slice(0, 6)}`,
    coins: 500,
    gems: 25,
    cosmetics: ['default'],
    createdAt: now,
    updatedAt: now,
    stats: {
      totalMatches: 0,
      totalWins: 0,
      totalScore: 0,
      totalWords: 0,
      bestScore: 0,
      winStreak: 0,
      bestWinStreak: 0,
      updatedAt: now,
    },
  };

  state.users.set(user.id, user);
  events.emit('users:updated', sanitizeUser(user));
  return sanitizeUser(user);
}

export function createGuestUser() {
  return upsertUser({
    discordId: null,
    username: `Guest-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
  });
}

export function getUser(userId) {
  return sanitizeUser(state.users.get(userId));
}

export function getPlayerStats(userId) {
  const user = state.users.get(userId);
  if (!user) return null;
  return {
    userId: user.id,
    username: user.username,
    coins: user.coins,
    gems: user.gems,
    ...getOrCreateUserStats(userId),
  };
}

export function getLeaderboard(limit = 10) {
  const leaderboard = Array.from(state.users.values())
    .map((user) => ({
      userId: user.id,
      username: user.username,
      coins: user.coins,
      gems: user.gems,
      ...getOrCreateUserStats(user.id),
    }))
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit);
  return leaderboard;
}

export function getMatchHistory(userId, limit = 20) {
  const matches = Array.from(state.matches.values())
    .filter((match) => match.players.some((player) => player.userId === userId))
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, limit)
    .map(sanitizeMatch);

  return matches;
}

export function getActiveSessions(serverId) {
  const sessions = Array.from(state.sessions.values())
    .filter((session) => session.serverId === serverId && session.status === 'active')
    .map(sanitizeSession);
  return sessions;
}

export function createLobby({ hostId, hostUsername, serverId = 'global', maxPlayers = 8 }) {
  const id = randomUUID();
  const code = generateLobbyCode();
  const now = new Date().toISOString();
  const lobby = {
    id,
    code,
    serverId,
    hostId,
    status: 'waiting',
    maxPlayers,
    createdAt: now,
    updatedAt: now,
    matchId: null,
    players: [
      {
        userId: hostId,
        username: hostUsername,
        ready: true,
        isHost: true,
        joinedAt: now,
      },
    ],
  };

  state.lobbies.set(id, lobby);
  events.emit('lobby:updated', sanitizeLobby(lobby));
  return sanitizeLobby(lobby);
}

export function getLobbyById(lobbyId) {
  return sanitizeLobby(state.lobbies.get(lobbyId));
}

export function getLobbyByCode(code) {
  const lobby = Array.from(state.lobbies.values()).find((l) => l.code === code);
  return sanitizeLobby(lobby);
}

export function joinLobbyByCode({ code, userId, username }) {
  const lobby = Array.from(state.lobbies.values()).find((l) => l.code === code);
  if (!lobby) {
    throw new Error('Lobby not found');
  }
  return joinLobby({ lobbyId: lobby.id, userId, username });
}

export function joinLobby({ lobbyId, userId, username }) {
  const lobby = state.lobbies.get(lobbyId);
  if (!lobby) {
    throw new Error('Lobby not found');
  }
  if (lobby.players.some((player) => player.userId === userId)) {
    return sanitizeLobby(lobby);
  }
  if (lobby.players.length >= lobby.maxPlayers) {
    throw new Error('Lobby is full');
  }
  const now = new Date().toISOString();
  lobby.players.push({
    userId,
    username,
    ready: false,
    isHost: false,
    joinedAt: now,
  });
  lobby.updatedAt = now;
  events.emit('lobby:updated', sanitizeLobby(lobby));
  return sanitizeLobby(lobby);
}

export function setPlayerReady({ lobbyId, userId, ready }) {
  const lobby = state.lobbies.get(lobbyId);
  if (!lobby) {
    throw new Error('Lobby not found');
  }
  const player = lobby.players.find((p) => p.userId === userId);
  if (!player) {
    throw new Error('Player not in lobby');
  }
  player.ready = ready;
  lobby.updatedAt = new Date().toISOString();
  events.emit('lobby:updated', sanitizeLobby(lobby));
  return sanitizeLobby(lobby);
}

export function leaveLobby({ lobbyId, userId }) {
  const lobby = state.lobbies.get(lobbyId);
  if (!lobby) {
    throw new Error('Lobby not found');
  }
  const playerIndex = lobby.players.findIndex((p) => p.userId === userId);
  if (playerIndex === -1) {
    return sanitizeLobby(lobby);
  }
  lobby.players.splice(playerIndex, 1);

  if (lobby.players.length === 0) {
    state.lobbies.delete(lobbyId);
    events.emit('lobby:deleted', { lobbyId });
    return null;
  }

  if (userId === lobby.hostId) {
    // promote next player
    const nextHost = lobby.players[0];
    lobby.hostId = nextHost.userId;
    nextHost.isHost = true;
  }

  lobby.updatedAt = new Date().toISOString();
  events.emit('lobby:updated', sanitizeLobby(lobby));
  return sanitizeLobby(lobby);
}

export function startLobby({ lobbyId }) {
  const lobby = state.lobbies.get(lobbyId);
  if (!lobby) {
    throw new Error('Lobby not found');
  }
  const allReady = lobby.players.every((player) => player.ready);
  if (!allReady) {
    throw new Error('All players must be ready');
  }
  const now = new Date().toISOString();
  lobby.status = 'playing';
  lobby.updatedAt = now;

  const matchId = randomUUID();
  lobby.matchId = matchId;

  const match = {
    id: matchId,
    lobbyId,
    status: 'in_progress',
    createdAt: now,
    updatedAt: now,
    players: lobby.players.map((player) => ({
      userId: player.userId,
      username: player.username,
      score: 0,
      wordsFound: [],
      rank: null,
    })),
  };
  state.matches.set(matchId, match);
  events.emit('match:started', sanitizeMatch(match));
  events.emit('lobby:updated', sanitizeLobby(lobby));
  return { lobby: sanitizeLobby(lobby), match: sanitizeMatch(match) };
}

export function recordMatchResults({ matchId, players, gridData, wordsFound, lobbyId }) {
  const match = state.matches.get(matchId) || {
    id: matchId,
    lobbyId: lobbyId ?? null,
    status: 'in_progress',
    createdAt: new Date().toISOString(),
    players: [],
  };

  const now = new Date().toISOString();
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  match.players = sortedPlayers.map((player, index) => ({
    userId: player.id,
    username: player.username,
    score: player.score,
    wordsFound: player.wordsFound || [],
    rank: index + 1,
  }));

  match.gridData = gridData;
  match.wordsFound = wordsFound;
  match.completedAt = now;
  match.status = 'completed';
  match.updatedAt = now;
  state.matches.set(match.id, match);

  sortedPlayers.forEach((player, index) => {
    const stats = getOrCreateUserStats(player.id);
    const isWinner = index === 0;
    stats.totalMatches += 1;
    stats.totalWins += isWinner ? 1 : 0;
    stats.totalScore += player.score;
    stats.totalWords += wordsFound.length;
    stats.bestScore = Math.max(stats.bestScore, player.score);
    stats.winStreak = isWinner ? stats.winStreak + 1 : 0;
    stats.bestWinStreak = Math.max(stats.bestWinStreak, stats.winStreak);
    stats.updatedAt = now;
  });

  if (lobbyId) {
    const lobby = state.lobbies.get(lobbyId);
    if (lobby) {
      lobby.status = 'finished';
      lobby.updatedAt = now;
      events.emit('lobby:updated', sanitizeLobby(lobby));
    }
  }

  events.emit('match:completed', sanitizeMatch(match));
  events.emit('stats:updated');
  return sanitizeMatch(match);
}

export function createSession({ userId, playerName, serverId, channelId }) {
  const id = randomUUID();
  const now = new Date().toISOString();
  const session = {
    id,
    userId,
    playerName,
    serverId,
    channelId: channelId ?? null,
    status: 'active',
    score: 0,
    roundNumber: 1,
    createdAt: now,
    updatedAt: now,
  };

  state.sessions.set(id, session);
  events.emit('session:updated', sanitizeSession(session));
  return sanitizeSession(session);
}

export function completeSession(sessionId, { score }) {
  const session = state.sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  session.status = 'completed';
  session.score = score ?? session.score;
  session.completedAt = new Date().toISOString();
  session.updatedAt = session.completedAt;
  events.emit('session:updated', sanitizeSession(session));
  return sanitizeSession(session);
}

export function joinMatchmaking({ userId, username, serverId }) {
  // Ensure user not already queued
  const existingIndex = state.matchmakingQueue.findIndex((entry) => entry.userId === userId);
  if (existingIndex === -1) {
    state.matchmakingQueue.push({
      userId,
      username,
      serverId,
      joinedAt: Date.now(),
    });
  }

  const queueForServer = state.matchmakingQueue.filter((entry) => entry.serverId === serverId);

  let lobby = null;
  if (queueForServer.length >= 2) {
    const [playerA, playerB] = queueForServer.slice(0, 2);
    state.matchmakingQueue = state.matchmakingQueue.filter(
      (entry) => entry.userId !== playerA.userId && entry.userId !== playerB.userId
    );
    lobby = createLobby({
      hostId: playerA.userId,
      hostUsername: playerA.username,
      serverId,
      maxPlayers: 8,
    });
    joinLobby({ lobbyId: lobby.id, userId: playerB.userId, username: playerB.username });
  }

  events.emit('matchmaking:updated', {
    queueSize: state.matchmakingQueue.length,
  });

  if (lobby) {
    return { status: 'matched', lobby };
  }

  const position =
    queueForServer.findIndex((entry) => entry.userId === userId) + 1 || queueForServer.length;

  return {
    status: 'queued',
    queuePosition: position,
    playersInQueue: queueForServer.length,
  };
}

export function leaveMatchmaking({ userId }) {
  const before = state.matchmakingQueue.length;
  state.matchmakingQueue = state.matchmakingQueue.filter((entry) => entry.userId !== userId);
  const after = state.matchmakingQueue.length;
  if (before !== after) {
    events.emit('matchmaking:updated', { queueSize: after });
  }
  return { success: true };
}

export function updateServerRecord({ serverId, userId, username, score, wordsFound, gemsCollected }) {
  const existing = state.serverRecords.get(serverId);
  const now = new Date().toISOString();
  if (!existing || existing.score < score) {
    const record = {
      serverId,
      userId,
      username,
      score,
      wordsFound,
      gemsCollected,
      achievedAt: now,
      updatedAt: now,
    };
    state.serverRecords.set(serverId, record);
    events.emit('server-record:updated', record);
    return record;
  }
  return existing;
}

export function getServerRecord(serverId) {
  return state.serverRecords.get(serverId) ?? null;
}

export function getMatchmakingSnapshot() {
  return {
    queueSize: state.matchmakingQueue.length,
    entries: state.matchmakingQueue.map((entry) => ({
      userId: entry.userId,
      username: entry.username,
      serverId: entry.serverId,
      joinedAt: entry.joinedAt,
    })),
  };
}
