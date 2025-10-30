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
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Remove user from queue
    const { error } = await supabase
      .from('matchmaking_queue')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    return res.status(200).json({ message: 'Left matchmaking queue' });
  } catch (error) {
    console.error('Error leaving matchmaking:', error);
    return res.status(500).json({ error: error.message });
  }
}
