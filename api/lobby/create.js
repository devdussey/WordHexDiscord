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
    const { userId, username, avatarUrl, serverId, channelId, maxPlayers = 8 } = req.body;

    if (!userId || !username) {
      return res.status(400).json({ error: 'userId and username are required' });
    }

    // Generate unique lobby code
    const { data: codeData, error: codeError } = await supabase
      .rpc('generate_lobby_code');

    if (codeError) throw codeError;
    const lobbyCode = codeData;

    // Create lobby
    const { data: lobby, error: lobbyError } = await supabase
      .from('lobbies')
      .insert({
        lobby_code: lobbyCode,
        host_id: userId,
        server_id: serverId,
        channel_id: channelId,
        max_players: maxPlayers,
        current_players: 1,
        status: 'waiting'
      })
      .select()
      .single();

    if (lobbyError) throw lobbyError;

    // Add host as first player
    const { error: playerError } = await supabase
      .from('lobby_players')
      .insert({
        lobby_id: lobby.id,
        user_id: userId,
        username: username,
        avatar_url: avatarUrl,
        is_ready: false,
        is_host: true
      });

    if (playerError) throw playerError;

    return res.status(200).json({
      lobby: {
        ...lobby,
        players: [{
          id: userId,
          username,
          avatar_url: avatarUrl,
          is_ready: false,
          is_host: true
        }]
      }
    });
  } catch (error) {
    console.error('Error creating lobby:', error);
    return res.status(500).json({ error: error.message });
  }
}
