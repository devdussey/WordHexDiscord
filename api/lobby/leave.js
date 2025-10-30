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
    const { lobbyId, userId } = req.body;

    if (!lobbyId || !userId) {
      return res.status(400).json({ error: 'lobbyId and userId are required' });
    }

    // Get lobby info
    const { data: lobby, error: lobbyError } = await supabase
      .from('lobbies')
      .select('*')
      .eq('id', lobbyId)
      .single();

    if (lobbyError || !lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }

    // Check if user is in lobby
    const { data: player, error: playerFetchError } = await supabase
      .from('lobby_players')
      .select('is_host')
      .eq('lobby_id', lobbyId)
      .eq('user_id', userId)
      .single();

    if (playerFetchError || !player) {
      return res.status(404).json({ error: 'You are not in this lobby' });
    }

    const isHost = player.is_host;

    // Remove player from lobby
    const { error: deleteError } = await supabase
      .from('lobby_players')
      .delete()
      .eq('lobby_id', lobbyId)
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    // If host left, either delete lobby or assign new host
    if (isHost) {
      // Get remaining players
      const { data: remainingPlayers, error: remainingError } = await supabase
        .from('lobby_players')
        .select('user_id')
        .eq('lobby_id', lobbyId)
        .limit(1);

      if (remainingError) throw remainingError;

      if (!remainingPlayers || remainingPlayers.length === 0) {
        // Delete lobby if no players left
        await supabase
          .from('lobbies')
          .delete()
          .eq('id', lobbyId);

        return res.status(200).json({ message: 'Lobby closed (no players remaining)' });
      } else {
        // Assign new host
        const newHostId = remainingPlayers[0].user_id;
        await supabase
          .from('lobby_players')
          .update({ is_host: true })
          .eq('lobby_id', lobbyId)
          .eq('user_id', newHostId);
      }
    }

    // Update lobby current_players count
    const { error: updateError } = await supabase
      .from('lobbies')
      .update({ current_players: lobby.current_players - 1 })
      .eq('id', lobbyId);

    if (updateError) throw updateError;

    return res.status(200).json({ message: 'Left lobby successfully' });
  } catch (error) {
    console.error('Error leaving lobby:', error);
    return res.status(500).json({ error: error.message });
  }
}
