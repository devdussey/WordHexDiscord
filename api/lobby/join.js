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
    const { lobbyCode, userId, username, avatarUrl } = req.body;

    if (!lobbyCode || !userId || !username) {
      return res.status(400).json({ error: 'lobbyCode, userId, and username are required' });
    }

    // Find lobby by code
    const { data: lobby, error: lobbyError } = await supabase
      .from('lobbies')
      .select('*')
      .eq('lobby_code', lobbyCode)
      .eq('status', 'waiting')
      .single();

    if (lobbyError || !lobby) {
      return res.status(404).json({ error: 'Lobby not found or already started' });
    }

    // Check if lobby is full
    if (lobby.current_players >= lobby.max_players) {
      return res.status(400).json({ error: 'Lobby is full' });
    }

    // Check if user is already in lobby
    const { data: existingPlayer } = await supabase
      .from('lobby_players')
      .select('id')
      .eq('lobby_id', lobby.id)
      .eq('user_id', userId)
      .single();

    if (existingPlayer) {
      return res.status(400).json({ error: 'You are already in this lobby' });
    }

    // Add player to lobby
    const { error: playerError } = await supabase
      .from('lobby_players')
      .insert({
        lobby_id: lobby.id,
        user_id: userId,
        username: username,
        avatar_url: avatarUrl,
        is_ready: false,
        is_host: false
      });

    if (playerError) throw playerError;

    // Update lobby current_players count
    const { error: updateError } = await supabase
      .from('lobbies')
      .update({ current_players: lobby.current_players + 1 })
      .eq('id', lobby.id);

    if (updateError) throw updateError;

    // Fetch updated lobby with all players
    const { data: players, error: playersError } = await supabase
      .from('lobby_players')
      .select('user_id, username, avatar_url, is_ready, is_host')
      .eq('lobby_id', lobby.id)
      .order('joined_at', { ascending: true });

    if (playersError) throw playersError;

    return res.status(200).json({
      lobby: {
        ...lobby,
        current_players: lobby.current_players + 1,
        players: players.map(p => ({
          id: p.user_id,
          username: p.username,
          avatar_url: p.avatar_url,
          is_ready: p.is_ready,
          is_host: p.is_host
        }))
      }
    });
  } catch (error) {
    console.error('Error joining lobby:', error);
    return res.status(500).json({ error: error.message });
  }
}
