import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import dotenv from 'dotenv';
import supabase from './supabase.js';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors());
app.use(express.json());

const clients = new Map();

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', async (message) => {
    const data = JSON.parse(message.toString());

    if (data.type === 'auth') {
      clients.set(data.userId, { ws, username: data.username });
      ws.userId = data.userId;
    }
  });

  ws.on('close', () => {
    if (ws.userId) {
      clients.delete(ws.userId);
    }
  });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username } = req.body;
    const discordId = username;

    // Check if user exists
    let { data: user, error } = await supabase
      .from('users')
      .select('id, username, discord_id, coins, gems')
      .eq('discord_id', discordId)
      .maybeSingle();

    if (error) throw error;

    // Create user if doesn't exist
    if (!user) {
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          username: discordId,
          discord_id: discordId,
          coins: 100,
          gems: 10,
          cosmetics: []
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Create player_stats for new user
      const { error: statsError } = await supabase
        .from('player_stats')
        .insert({
          user_id: newUser.id,
          total_matches: 0,
          total_wins: 0,
          total_score: 0,
          total_words: 0,
          best_score: 0,
          win_streak: 0,
          best_win_streak: 0
        });

      if (statsError) {
        console.error('Failed to create player_stats:', statsError);
      }

      user = newUser;
    }

    res.json({
      token: `user_${user.id}`,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

app.post('/api/auth/guest', async (req, res) => {
  try {
    const guestName = `Guest_${Date.now()}`;
    const guestDiscordId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        username: guestName,
        discord_id: guestDiscordId,
        coins: 50,
        gems: 5,
        cosmetics: []
      })
      .select()
      .single();

    if (error) throw error;

    // Create player_stats for guest user
    const { error: statsError } = await supabase
      .from('player_stats')
      .insert({
        user_id: user.id,
        total_matches: 0,
        total_wins: 0,
        total_score: 0,
        total_words: 0,
        best_score: 0,
        win_streak: 0,
        best_win_streak: 0
      });

    if (statsError) {
      console.error('Failed to create player_stats:', statsError);
    }

    res.json({
      token: `user_${user.id}`,
      user
    });
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({ error: 'Guest login failed', details: error.message });
  }
});

app.post('/api/game/sessions', async (req, res) => {
  try {
    const { userId, score, wordsFound, gemsCollected, duration, gridData, serverId, channelId } = req.body;

    // Create game session
    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .insert({
        user_id: userId,
        score: score || 0,
        words_found: wordsFound || 0,
        gems_collected: gemsCollected || 0,
        duration: duration || 0,
        grid_data: gridData,
        server_id: serverId,
        channel_id: channelId,
        game_status: 'completed',
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Update player_stats
    const { data: stats, error: statsSelectError } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (statsSelectError) throw statsSelectError;

    if (stats) {
      const newTotalGames = stats.total_matches + 1;
      const newTotalScore = stats.total_score + score;
      const newBestScore = Math.max(stats.best_score, score);

      const { error: statsUpdateError } = await supabase
        .from('player_stats')
        .update({
          total_matches: newTotalGames,
          total_score: newTotalScore,
          total_words: stats.total_words + wordsFound,
          best_score: newBestScore,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (statsUpdateError) {
        console.error('Failed to update player_stats:', statsUpdateError);
      }
    } else {
      // Create stats if they don't exist
      const { error: statsInsertError } = await supabase
        .from('player_stats')
        .insert({
          user_id: userId,
          total_matches: 1,
          total_wins: 0,
          total_score: score,
          total_words: wordsFound,
          best_score: score,
          win_streak: 0,
          best_win_streak: 0
        });

      if (statsInsertError) {
        console.error('Failed to create player_stats:', statsInsertError);
      }
    }

    res.json(session);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session', details: error.message });
  }
});

app.get('/api/game/leaderboard', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('player_stats')
      .select(`
        *,
        users (
          username,
          avatar_url,
          coins,
          gems
        )
      `)
      .order('best_score', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Format response to match expected structure
    const formattedData = data.map(stat => ({
      username: stat.users.username,
      avatar_url: stat.users.avatar_url,
      coins: stat.users.coins,
      gems: stat.users.gems,
      user_id: stat.user_id,
      total_matches: stat.total_matches,
      total_wins: stat.total_wins,
      total_score: stat.total_score,
      total_words: stat.total_words,
      best_score: stat.best_score,
      win_streak: stat.win_streak,
      best_win_streak: stat.best_win_streak,
      updated_at: stat.updated_at
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard', details: error.message });
  }
});

app.get('/api/game/server-records', async (req, res) => {
  try {
    const { serverId } = req.query;

    const { data, error } = await supabase
      .from('server_records')
      .select('*')
      .eq('server_id', serverId)
      .maybeSingle();

    if (error) throw error;

    res.json(data || null);
  } catch (error) {
    console.error('Server record error:', error);
    res.status(500).json({ error: 'Failed to fetch server record', details: error.message });
  }
});

app.post('/api/game/server-records', async (req, res) => {
  try {
    const { serverId, userId, username, score, wordsFound, gemsCollected } = req.body;

    // Check if a record exists for this server
    const { data: existingRecord, error: selectError } = await supabase
      .from('server_records')
      .select('*')
      .eq('server_id', serverId)
      .maybeSingle();

    if (selectError) throw selectError;

    let result;

    if (!existingRecord) {
      // No existing record, insert new one
      const { data, error } = await supabase
        .from('server_records')
        .insert({
          server_id: serverId,
          user_id: userId,
          username: username,
          score: score,
          words_found: wordsFound,
          gems_collected: gemsCollected,
          achieved_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else if (existingRecord.score < score) {
      // Existing record has lower score, update it
      const { data, error } = await supabase
        .from('server_records')
        .update({
          user_id: userId,
          username: username,
          score: score,
          words_found: wordsFound,
          gems_collected: gemsCollected,
          achieved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('server_id', serverId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Existing record has higher or equal score, don't update
      result = existingRecord;
    }

    res.json(result);
  } catch (error) {
    console.error('Update server record error:', error);
    res.status(500).json({ error: 'Failed to update server record', details: error.message });
  }
});

app.get('/api/game/sessions', async (req, res) => {
  try {
    const { userId } = req.query;

    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions', details: error.message });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready at ws://localhost:${PORT}/ws`);
});
