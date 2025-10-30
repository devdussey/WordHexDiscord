import { supabase, handleCors } from '../_supabase.js';

export default async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    return res.status(200).json({
      token: `user_${user.id}`,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Login failed',
      details: error.message
    });
  }
}
