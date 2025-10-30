import { supabase, handleCors } from '../_supabase.js';

export default async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    return res.status(200).json(formattedData);
  } catch (error) {
    console.error('Leaderboard error:', error);
    return res.status(500).json({
      error: 'Failed to fetch leaderboard',
      details: error.message
    });
  }
}
