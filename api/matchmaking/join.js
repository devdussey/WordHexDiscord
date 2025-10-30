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
    const { userId, username, avatarUrl, serverId } = req.body;

    if (!userId || !username) {
      return res.status(400).json({ error: 'userId and username are required' });
    }

    // Clean up old queue entries
    await supabase.rpc('cleanup_matchmaking_queue');

    // Check if user is already in queue
    const { data: existingEntry } = await supabase
      .from('matchmaking_queue')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingEntry) {
      return res.status(400).json({ error: 'Already in matchmaking queue' });
    }

    // Add user to queue
    const { error: queueError } = await supabase
      .from('matchmaking_queue')
      .insert({
        user_id: userId,
        username: username,
        avatar_url: avatarUrl,
        server_id: serverId
      });

    if (queueError) throw queueError;

    // Try to find a match
    const { data: queuedPlayers, error: playersError } = await supabase
      .from('matchmaking_queue')
      .select('*')
      .eq('server_id', serverId)
      .order('searching_since', { ascending: true })
      .limit(8);

    if (playersError) throw playersError;

    // If we have at least 2 players, create a lobby
    if (queuedPlayers && queuedPlayers.length >= 2) {
      // Generate lobby code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_lobby_code');

      if (codeError) throw codeError;
      const lobbyCode = codeData;

      // Create lobby with first player as host
      const host = queuedPlayers[0];
      const { data: lobby, error: lobbyError } = await supabase
        .from('lobbies')
        .insert({
          lobby_code: lobbyCode,
          host_id: host.user_id,
          server_id: serverId,
          max_players: 8,
          current_players: queuedPlayers.length,
          status: 'waiting'
        })
        .select()
        .single();

      if (lobbyError) throw lobbyError;

      // Add all queued players to lobby
      const lobbyPlayers = queuedPlayers.map((player, index) => ({
        lobby_id: lobby.id,
        user_id: player.user_id,
        username: player.username,
        avatar_url: player.avatar_url,
        is_ready: true, // Auto-ready for matchmaking
        is_host: index === 0
      }));

      const { error: playersInsertError } = await supabase
        .from('lobby_players')
        .insert(lobbyPlayers);

      if (playersInsertError) throw playersInsertError;

      // Remove players from queue
      const playerIds = queuedPlayers.map(p => p.user_id);
      await supabase
        .from('matchmaking_queue')
        .delete()
        .in('user_id', playerIds);

      return res.status(200).json({
        status: 'matched',
        lobby: {
          ...lobby,
          players: lobbyPlayers.map(p => ({
            id: p.user_id,
            username: p.username,
            avatar_url: p.avatar_url,
            is_ready: p.is_ready,
            is_host: p.is_host
          }))
        }
      });
    }

    return res.status(200).json({
      status: 'searching',
      queuePosition: queuedPlayers ? queuedPlayers.findIndex(p => p.user_id === userId) + 1 : 1,
      playersInQueue: queuedPlayers ? queuedPlayers.length : 1
    });
  } catch (error) {
    console.error('Error joining matchmaking:', error);
    return res.status(500).json({ error: error.message });
  }
}
