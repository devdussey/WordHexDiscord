import { supabase, handleCors } from '../_supabase.js';

export default async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    return res.status(200).json({
      token: `user_${user.id}`,
      user
    });
  } catch (error) {
    console.error('Guest login error:', error);
    return res.status(500).json({
      error: 'Guest login failed',
      details: error.message
    });
  }
}
