import { supabase, corsHeaders } from '../_supabase.js';

function handleCors(req, res) {
  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders()).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    res.status(200).end();
    return true;
  }
  Object.entries(corsHeaders()).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  return false;
}

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lobbyId, userId, gridData } = req.body;

    if (!lobbyId || !userId || !gridData) {
      return res.status(400).json({ error: 'lobbyId, userId, and gridData are required' });
    }

    // Verify user is host
    const { data: player, error: playerError } = await supabase
      .from('lobby_players')
      .select('is_host')
      .eq('lobby_id', lobbyId)
      .eq('user_id', userId)
      .single();

    if (playerError || !player || !player.is_host) {
      return res.status(403).json({ error: 'Only the host can start the game' });
    }

    // Get all players
    const { data: players, error: playersError } = await supabase
      .from('lobby_players')
      .select('user_id, is_ready, is_host')
      .eq('lobby_id', lobbyId);

    if (playersError) throw playersError;

    // Check if all non-host players are ready
    const allReady = players.every(p => p.is_host || p.is_ready);
    if (!allReady) {
      return res.status(400).json({ error: 'Not all players are ready' });
    }

    // Create match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        lobby_id: lobbyId,
        grid_data: gridData,
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (matchError) throw matchError;

    // Add all players to match_players
    const matchPlayers = players.map(p => ({
      match_id: match.id,
      user_id: p.user_id,
      score: 0,
      words_found: []
    }));

    const { error: matchPlayersError } = await supabase
      .from('match_players')
      .insert(matchPlayers);

    if (matchPlayersError) throw matchPlayersError;

    // Update lobby status
    const { error: lobbyUpdateError } = await supabase
      .from('lobbies')
      .update({
        status: 'in_progress',
        match_id: match.id,
        started_at: new Date().toISOString()
      })
      .eq('id', lobbyId);

    if (lobbyUpdateError) throw lobbyUpdateError;

    return res.status(200).json({
      match: {
        id: match.id,
        lobby_id: lobbyId,
        grid_data: gridData,
        status: 'in_progress'
      }
    });
  } catch (error) {
    console.error('Error starting game:', error);
    return res.status(500).json({ error: error.message });
  }
}
