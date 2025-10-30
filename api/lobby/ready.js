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
    const { lobbyId, userId, isReady } = req.body;

    if (!lobbyId || !userId || typeof isReady !== 'boolean') {
      return res.status(400).json({ error: 'lobbyId, userId, and isReady are required' });
    }

    // Update player ready status
    const { error: updateError } = await supabase
      .from('lobby_players')
      .update({ is_ready: isReady })
      .eq('lobby_id', lobbyId)
      .eq('user_id', userId);

    if (updateError) throw updateError;

    return res.status(200).json({ message: 'Ready status updated' });
  } catch (error) {
    console.error('Error updating ready status:', error);
    return res.status(500).json({ error: error.message });
  }
}
