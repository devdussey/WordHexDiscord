import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { randomUUID } from 'crypto';

import {
  upsertUser,
  createGuestUser,
  createLobby,
  joinLobby,
  joinLobbyByCode,
  getLobbyById,
  setPlayerReady,
  leaveLobby,
  startLobby,
  createSession,
  completeSession,
  joinMatchmaking,
  leaveMatchmaking,
  getLeaderboard,
  getPlayerStats,
  getMatchHistory,
  getActiveSessions,
  updateMatchProgress,
  recordMatchResults,
  updateServerRecord,
  getServerRecord,
  getMatchmakingSnapshot,
  onStateEvent,
} from './state.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

app.use(cors());
app.use(express.json());

const CHANNEL_MATCHMAKING = 'matchmaking:global';

const channelSubscriptions = new Map(); // channel -> Set<ws>

function subscriptionKey(channel) {
  return channel.toString();
}

function subscribe(ws, channel) {
  const key = subscriptionKey(channel);
  if (!channelSubscriptions.has(key)) {
    channelSubscriptions.set(key, new Set());
  }
  channelSubscriptions.get(key).add(ws);
  if (!ws.subscriptions) {
    ws.subscriptions = new Set();
  }
  ws.subscriptions.add(key);
}

function unsubscribe(ws, channel) {
  const key = subscriptionKey(channel);
  if (channelSubscriptions.has(key)) {
    channelSubscriptions.get(key).delete(ws);
    if (channelSubscriptions.get(key).size === 0) {
      channelSubscriptions.delete(key);
    }
  }
  if (ws.subscriptions) {
    ws.subscriptions.delete(key);
  }
}

function broadcast(channel, payload) {
  const key = subscriptionKey(channel);
  const subscribers = channelSubscriptions.get(key);
  if (!subscribers) return;
  const message = JSON.stringify({ channel: key, ...payload });
  subscribers.forEach((ws) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  ws.subscriptions = new Set();

  ws.on('message', (raw) => {
    try {
      const message = JSON.parse(raw.toString());
      if (message.type === 'identify') {
        ws.userId = message.userId;
        ws.username = message.username;
      }
      if (message.type === 'subscribe') {
        subscribe(ws, message.channel);
      }
      if (message.type === 'unsubscribe') {
        unsubscribe(ws, message.channel);
      }
    } catch (error) {
      console.error('Failed to handle websocket message', error);
    }
  });

  ws.on('close', () => {
    if (ws.subscriptions) {
      ws.subscriptions.forEach((channel) => unsubscribe(ws, channel));
    }
  });
});

// Broadcast hooks
onStateEvent('lobby:updated', (lobby) => {
  if (lobby) {
    broadcast(`lobby:${lobby.id}`, { type: 'lobby:update', lobby });
    broadcast(`server:${lobby.serverId}:lobbies`, { type: 'lobby:update', lobby });
  }
});

onStateEvent('lobby:deleted', ({ lobbyId }) => {
  broadcast(`lobby:${lobbyId}`, { type: 'lobby:deleted', lobbyId });
});

onStateEvent('matchmaking:updated', (snapshot) => {
  broadcast(CHANNEL_MATCHMAKING, { type: 'matchmaking:update', snapshot });
});

onStateEvent('match:started', (match) => {
  if (match?.lobbyId) {
    broadcast(`lobby:${match.lobbyId}`, { type: 'match:started', match });
  }
  broadcast(`match:${match.id}`, { type: 'match:update', match });
});

onStateEvent('match:updated', (match) => {
  if (match?.lobbyId) {
    broadcast(`lobby:${match.lobbyId}`, { type: 'match:update', match });
  }
  broadcast(`match:${match.id}`, { type: 'match:update', match });
});

onStateEvent('match:completed', (match) => {
  if (match?.lobbyId) {
    broadcast(`lobby:${match.lobbyId}`, { type: 'match:completed', match });
  }
});

onStateEvent('session:updated', (session) => {
  broadcast(`sessions:${session.serverId}`, { type: 'sessions:update', session });
});

onStateEvent('server-record:updated', (record) => {
  broadcast(`server-record:${record.serverId}`, { type: 'server-record:update', record });
});

// Routes
app.post('/api/auth/login', (req, res) => {
  try {
    const { discordId, username } = req.body ?? {};
    if (!discordId && !username) {
      return res.status(400).json({ error: 'discordId or username required' });
    }
    const user = upsertUser({ discordId, username });
    res.json({ token: user.id, user });
  } catch (error) {
    console.error('auth/login error', error);
    res.status(500).json({ error: 'Failed to login', details: error.message });
  }
});

app.post('/api/auth/guest', (_req, res) => {
  try {
    const user = createGuestUser();
    res.json({ token: user.id, user });
  } catch (error) {
    console.error('auth/guest error', error);
    res.status(500).json({ error: 'Failed to create guest', details: error.message });
  }
});

app.post('/api/matchmaking/join', (req, res) => {
  try {
    const { userId, username, serverId = 'global' } = req.body ?? {};
    if (!userId || !username) {
      return res.status(400).json({ error: 'userId and username are required' });
    }
    const result = joinMatchmaking({ userId, username, serverId });
    res.json(result);
  } catch (error) {
    console.error('matchmaking/join error', error);
    res.status(500).json({ error: 'Failed to join queue', details: error.message });
  }
});

app.post('/api/matchmaking/leave', (req, res) => {
  try {
    const { userId } = req.body ?? {};
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }
    const result = leaveMatchmaking({ userId });
    res.json(result);
  } catch (error) {
    console.error('matchmaking/leave error', error);
    res.status(500).json({ error: 'Failed to leave queue', details: error.message });
  }
});

app.get('/api/matchmaking/snapshot', (_req, res) => {
  res.json(getMatchmakingSnapshot());
});

app.post('/api/lobby/create', (req, res) => {
  try {
    const { hostId, username, serverId = 'global' } = req.body ?? {};
    if (!hostId || !username) {
      return res.status(400).json({ error: 'hostId and username are required' });
    }
    const lobby = createLobby({ hostId, hostUsername: username, serverId });
    res.json({ lobby });
  } catch (error) {
    console.error('lobby/create error', error);
    res.status(500).json({ error: 'Failed to create lobby', details: error.message });
  }
});

app.post('/api/lobby/join', (req, res) => {
  try {
    const { code, lobbyId, userId, username } = req.body ?? {};
    if (!userId || !username) {
      return res.status(400).json({ error: 'userId and username are required' });
    }
    let lobby = null;
    if (code) {
      lobby = joinLobbyByCode({ code: code.toString(), userId, username });
    } else if (lobbyId) {
      lobby = joinLobby({ lobbyId, userId, username });
    } else {
      return res.status(400).json({ error: 'code or lobbyId required' });
    }
    res.json({ lobby });
  } catch (error) {
    console.error('lobby/join error', error);
    res.status(500).json({ error: 'Failed to join lobby', details: error.message });
  }
});

app.get('/api/lobby/:lobbyId', (req, res) => {
  const lobby = getLobbyById(req.params.lobbyId);
  if (!lobby) {
    return res.status(404).json({ error: 'Lobby not found' });
  }
  res.json(lobby);
});

app.post('/api/lobby/ready', (req, res) => {
  try {
    const { lobbyId, userId, ready } = req.body ?? {};
    if (!lobbyId || !userId || typeof ready !== 'boolean') {
      return res.status(400).json({ error: 'lobbyId, userId and ready are required' });
    }
    const lobby = setPlayerReady({ lobbyId, userId, ready });
    res.json({ lobby });
  } catch (error) {
    console.error('lobby/ready error', error);
    res.status(500).json({ error: 'Failed to update ready status', details: error.message });
  }
});

app.post('/api/lobby/leave', (req, res) => {
  try {
    const { lobbyId, userId } = req.body ?? {};
    if (!lobbyId || !userId) {
      return res.status(400).json({ error: 'lobbyId and userId required' });
    }
    const lobby = leaveLobby({ lobbyId, userId });
    res.json({ lobby });
  } catch (error) {
    console.error('lobby/leave error', error);
    res.status(500).json({ error: 'Failed to leave lobby', details: error.message });
  }
});

app.post('/api/lobby/start', (req, res) => {
  try {
    const { lobbyId } = req.body ?? {};
    if (!lobbyId) {
      return res.status(400).json({ error: 'lobbyId required' });
    }
    const result = startLobby({ lobbyId });
    res.json(result);
  } catch (error) {
    console.error('lobby/start error', error);
    res.status(500).json({ error: 'Failed to start lobby', details: error.message });
  }
});

app.post('/api/game/sessions', (req, res) => {
  try {
    const { userId, playerName, serverId = 'global', channelId } = req.body ?? {};
    if (!userId || !playerName) {
      return res.status(400).json({ error: 'userId and playerName required' });
    }
    const session = createSession({ userId, playerName, serverId, channelId });
    res.json({ session });
  } catch (error) {
    console.error('game/sessions error', error);
    res.status(500).json({ error: 'Failed to create session', details: error.message });
  }
});

app.post('/api/game/sessions/:sessionId/complete', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { score } = req.body ?? {};
    const session = completeSession(sessionId, { score });
    res.json({ session });
  } catch (error) {
    console.error('game/sessions complete error', error);
    res.status(500).json({ error: 'Failed to complete session', details: error.message });
  }
});

app.post('/api/game/matches/:matchId/progress', (req, res) => {
  try {
    const { matchId } = req.params;
    const {
      players,
      currentPlayerId,
      gridData,
      wordsFound,
      roundNumber,
      lastTurn,
      gameOver,
    } = req.body ?? {};

    if (!matchId) {
      return res.status(400).json({ error: 'matchId required' });
    }

    const match = updateMatchProgress({
      matchId,
      players,
      currentPlayerId,
      gridData,
      wordsFound,
      roundNumber,
      lastTurn,
      gameOver,
    });

    res.json({ match });
  } catch (error) {
    console.error('game/matches progress error', error);
    res.status(500).json({ error: 'Failed to update match', details: error.message });
  }
});

app.post('/api/game/matches', (req, res) => {
  try {
    const { matchId, players, gridData, wordsFound, lobbyId } = req.body ?? {};
    if (!players || !Array.isArray(players)) {
      return res.status(400).json({ error: 'players array required' });
    }
    const match = recordMatchResults({
      matchId: matchId ?? randomUUID(),
      players,
      gridData,
      wordsFound: wordsFound ?? [],
      lobbyId,
    });
    res.json({ match });
  } catch (error) {
    console.error('game/matches error', error);
    res.status(500).json({ error: 'Failed to record match', details: error.message });
  }
});

app.get('/api/sessions/active', (req, res) => {
  const { serverId = 'global' } = req.query;
  const sessions = getActiveSessions(serverId);
  res.json(sessions);
});

app.get('/api/leaderboard', (req, res) => {
  const limit = Number(req.query.limit) || 10;
  res.json(getLeaderboard(limit));
});

app.get('/api/stats/:userId', (req, res) => {
  const stats = getPlayerStats(req.params.userId);
  if (!stats) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(stats);
});

app.get('/api/matches/:userId', (req, res) => {
  const limit = Number(req.query.limit) || 20;
  res.json(getMatchHistory(req.params.userId, limit));
});

app.get('/api/server-records', (req, res) => {
  const { serverId = 'global' } = req.query;
  res.json(getServerRecord(serverId) ?? null);
});

app.post('/api/server-records', (req, res) => {
  try {
    const { serverId = 'global', userId, username, score, wordsFound, gemsCollected } = req.body ?? {};
    if (!userId || !username || typeof score !== 'number') {
      return res.status(400).json({ error: 'userId, username and score are required' });
    }
    const record = updateServerRecord({
      serverId,
      userId,
      username,
      score,
      wordsFound: wordsFound ?? 0,
      gemsCollected: gemsCollected ?? 0,
    });
    res.json(record);
  } catch (error) {
    console.error('server-records update error', error);
    res.status(500).json({ error: 'Failed to update server record', details: error.message });
  }
});

app.post('/api/logs', (req, res) => {
  const payload = req.body ?? {};
  console.warn('[ClientLog]', payload);
  res.json({ ok: true });
});

const PORT = Number(process.env.PORT || 3001);
httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`WebSocket listening on ws://localhost:${PORT}/ws`);
});
