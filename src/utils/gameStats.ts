import { supabase } from '../lib/supabase';

interface Player {
  id: string;
  username: string;
  score: number;
}

interface SaveMatchParams {
  players: Player[];
  gridData: any;
  wordsFound: any[];
  lobbyId?: string;
}

export async function saveMatchResults({ players, gridData, wordsFound, lobbyId }: SaveMatchParams) {
  try {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        lobby_id: lobbyId || 'default',
        grid_data: gridData,
        status: 'completed',
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString()
      })
      .select()
      .single();

    if (matchError) throw matchError;

    const matchPlayerPromises = sortedPlayers.map((player, index) =>
      supabase.from('match_players').insert({
        match_id: match.id,
        user_id: player.id,
        score: player.score,
        words_found: wordsFound,
        rank: index + 1
      })
    );

    await Promise.all(matchPlayerPromises);

    const statsUpdatePromises = sortedPlayers.map(async (player, index) => {
      const isWinner = index === 0;

      const { data: existingStats } = await supabase
        .from('player_stats')
        .select('*')
        .eq('user_id', player.id)
        .maybeSingle();

      if (existingStats) {
        const newWinStreak = isWinner ? existingStats.win_streak + 1 : 0;
        const newBestWinStreak = Math.max(newWinStreak, existingStats.best_win_streak);

        return supabase
          .from('player_stats')
          .update({
            total_matches: existingStats.total_matches + 1,
            total_wins: existingStats.total_wins + (isWinner ? 1 : 0),
            total_score: existingStats.total_score + player.score,
            total_words: existingStats.total_words + wordsFound.length,
            best_score: Math.max(player.score, existingStats.best_score),
            win_streak: newWinStreak,
            best_win_streak: newBestWinStreak,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', player.id);
      } else {
        return supabase
          .from('player_stats')
          .insert({
            user_id: player.id,
            total_matches: 1,
            total_wins: isWinner ? 1 : 0,
            total_score: player.score,
            total_words: wordsFound.length,
            best_score: player.score,
            win_streak: isWinner ? 1 : 0,
            best_win_streak: isWinner ? 1 : 0
          });
      }
    });

    await Promise.all(statsUpdatePromises);

    return { success: true, matchId: match.id };
  } catch (error) {
    console.error('Failed to save match results:', error);
    return { success: false, error };
  }
}

export async function getPlayerStats(userId: string) {
  try {
    const { data, error } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to fetch player stats:', error);
    return null;
  }
}

export async function getLeaderboard(limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('player_stats')
      .select(`
        *,
        users (
          username,
          avatar_url
        )
      `)
      .order('total_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return [];
  }
}
