import { supabase, handleCors } from '../_supabase.js';

export default async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  if (req.method === 'POST') {
    return handleCreateSession(req, res);
  } else if (req.method === 'GET') {
    return handleGetSessions(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleCreateSession(req, res) {
  try {
    const { userId, score, wordsFound, gemsCollected, duration, gridData, serverId, channelId } = req.body;

    // Create game session
    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .insert({
        user_id: userId,
        score: score || 0,
        words_found: wordsFound || 0,
        gems_collected: gemsCollected || 0,
        duration: duration || 0,
        grid_data: gridData,
        server_id: serverId,
        channel_id: channelId,
        game_status: 'completed',
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Update player_stats
    const { data: stats, error: statsSelectError } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (statsSelectError) throw statsSelectError;

    if (stats) {
      const newTotalGames = stats.total_matches + 1;
      const newTotalScore = stats.total_score + score;
      const newBestScore = Math.max(stats.best_score, score);

      const { error: statsUpdateError } = await supabase
        .from('player_stats')
        .update({
          total_matches: newTotalGames,
          total_score: newTotalScore,
          total_words: stats.total_words + wordsFound,
          best_score: newBestScore,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (statsUpdateError) {
        console.error('Failed to update player_stats:', statsUpdateError);
      }
    } else {
      // Create stats if they don't exist
      const { error: statsInsertError } = await supabase
        .from('player_stats')
        .insert({
          user_id: userId,
          total_matches: 1,
          total_wins: 0,
          total_score: score,
          total_words: wordsFound,
          best_score: score,
          win_streak: 0,
          best_win_streak: 0
        });

      if (statsInsertError) {
        console.error('Failed to create player_stats:', statsInsertError);
      }
    }

    return res.status(200).json(session);
  } catch (error) {
    console.error('Create session error:', error);
    return res.status(500).json({
      error: 'Failed to create session',
      details: error.message
    });
  }
}

async function handleGetSessions(req, res) {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return res.status(200).json(data || []);
  } catch (error) {
    console.error('Get sessions error:', error);
    return res.status(500).json({
      error: 'Failed to fetch sessions',
      details: error.message
    });
  }
}
