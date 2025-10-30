import { useState, useEffect } from 'react';
import { Loader2, X, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface MatchmakingQueueProps {
  playerName: string;
  onMatchFound: (lobbyId: string, lobbyCode: string) => void;
  onCancel: () => void;
  serverId?: string;
}

export function MatchmakingQueue({ onCancel, onMatchFound, serverId }: MatchmakingQueueProps) {
  const { user, getUsername } = useAuth();
  const [timeInQueue, setTimeInQueue] = useState(0);
  const [queuePosition, setQueuePosition] = useState(0);
  const [playersInQueue, setPlayersInQueue] = useState(1);

  useEffect(() => {
    joinQueue();

    const interval = setInterval(() => {
      setTimeInQueue(t => t + 1);
    }, 1000);

    // Subscribe to matchmaking queue updates
    const channel = supabase
      .channel('matchmaking-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matchmaking_queue',
          filter: serverId ? `server_id=eq.${serverId}` : undefined
        },
        () => {
          checkForMatch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lobbies'
        },
        async (payload) => {
          // Check if this lobby was created for us
          const { data: players } = await supabase
            .from('lobby_players')
            .select('lobby_id, user_id')
            .eq('lobby_id', payload.new.id)
            .eq('user_id', user?.id || '');

          if (players && players.length > 0) {
            const { data: lobby } = await supabase
              .from('lobbies')
              .select('id, lobby_code')
              .eq('id', payload.new.id)
              .single();

            if (lobby) {
              onMatchFound(lobby.id, lobby.lobby_code);
            }
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
      leaveQueue();
    };
  }, []);

  const joinQueue = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/matchmaking/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || '',
          username: getUsername(),
          avatarUrl: user?.user_metadata?.avatar_url,
          serverId: serverId
        })
      });

      const data = await response.json();

      if (data.status === 'matched') {
        onMatchFound(data.lobby.id, data.lobby.lobby_code);
      } else {
        setQueuePosition(data.queuePosition || 1);
        setPlayersInQueue(data.playersInQueue || 1);
      }
    } catch (error) {
      console.error('Failed to join matchmaking:', error);
    }
  };

  const checkForMatch = async () => {
    try {
      const { data: queueData } = await supabase
        .from('matchmaking_queue')
        .select('user_id')
        .eq('server_id', serverId || '')
        .order('searching_since', { ascending: true});

      if (queueData) {
        setPlayersInQueue(queueData.length);
        const myPosition = queueData.findIndex(q => q.user_id === (user?.id || ''));
        if (myPosition >= 0) {
          setQueuePosition(myPosition + 1);
        }
      }
    } catch (error) {
      console.error('Failed to check queue:', error);
    }
  };

  const leaveQueue = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      await fetch(`${API_URL}/matchmaking/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || ''
        })
      });
    } catch (error) {
      console.error('Failed to leave matchmaking:', error);
    }
  };

  const handleCancel = async () => {
    await leaveQueue();
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-fuchsia-950 flex items-center justify-center p-8">
      <div className="max-w-lg w-full">
        <div className="bg-purple-900/30 rounded-2xl p-12 shadow-2xl border-4 border-purple-700/50 text-center">
          <Loader2 className="w-16 h-16 text-purple-400 mx-auto mb-6 animate-spin" />

          <h2 className="text-4xl font-bold text-white mb-4">Searching for Players</h2>

          <div className="space-y-4 mb-8">
            <div className="bg-purple-950/50 rounded-lg p-4">
              <p className="text-purple-300 text-sm mb-1">Time in Queue</p>
              <p className="text-3xl font-bold text-white font-mono">{formatTime(timeInQueue)}</p>
            </div>

            <div className="bg-purple-950/50 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-5 h-5 text-purple-400" />
                <p className="text-purple-300 text-sm">Players in Queue</p>
              </div>
              <p className="text-2xl font-bold text-white">{playersInQueue}</p>
              <p className="text-purple-400 text-xs mt-1">Your position: #{queuePosition}</p>
            </div>
          </div>

          <p className="text-purple-300 text-sm mb-6">
            Matching you with up to 7 other players...
          </p>

          <button
            onClick={handleCancel}
            className="px-8 py-3 bg-purple-800/50 hover:bg-purple-700/50 text-white rounded-xl
                     font-semibold transition-all flex items-center gap-2 mx-auto shadow-lg border-2 border-purple-600/30"
          >
            <X className="w-5 h-5" />
            Cancel Search
          </button>
        </div>
      </div>
    </div>
  );
}
