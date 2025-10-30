import { useState, useEffect } from 'react';
import { Users, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface GameSession {
  id: string;
  player_name: string;
  player_avatar_url?: string;
  score: number;
  round_number: number;
  created_at: string;
}

interface ActiveSessionsListProps {
  serverId: string;
  onJoinSession: (sessionId: string) => void;
}

export function ActiveSessionsList({ serverId, onJoinSession }: ActiveSessionsListProps) {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveSessions();

    const channel = supabase
      .channel('active-sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_sessions',
          filter: `server_id=eq.${serverId}`
        },
        () => {
          fetchActiveSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [serverId]);

  const fetchActiveSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('id, player_name, player_avatar_url, score, round_number, created_at')
        .eq('server_id', serverId)
        .eq('game_status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Failed to fetch active sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border-2 border-slate-700/50">
        <h3 className="text-xl font-bold text-white mb-4">Active Sessions</h3>
        <div className="text-center text-slate-400 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border-2 border-slate-700/50">
        <h3 className="text-xl font-bold text-white mb-4">Active Sessions</h3>
        <div className="text-center text-slate-400 py-8">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No active games in this server</p>
          <p className="text-sm mt-2">Be the first to start a game!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border-2 border-slate-700/50">
      <h3 className="text-xl font-bold text-white mb-4">
        Active Sessions ({sessions.length})
      </h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="bg-slate-700/50 rounded-lg p-4 border-2 border-slate-600/50
                     hover:border-purple-500/50 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {session.player_avatar_url ? (
                  <img
                    src={session.player_avatar_url}
                    alt={session.player_name}
                    className="w-10 h-10 rounded-full border-2 border-purple-400"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500
                               flex items-center justify-center text-white font-bold border-2 border-purple-400">
                    {session.player_name[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-white font-semibold">{session.player_name}</p>
                  <p className="text-slate-400 text-sm">
                    Round {session.round_number} • {session.score} pts
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => onJoinSession(session.id)}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600
                       hover:from-purple-700 hover:to-pink-700
                       text-white rounded-lg font-semibold transition-all
                       flex items-center justify-center gap-2
                       transform hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4" />
              Join Game
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
