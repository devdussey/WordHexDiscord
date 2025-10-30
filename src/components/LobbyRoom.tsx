import { useState, useEffect } from 'react';
import { Users, X, Copy, Check, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LobbyRoomProps {
  lobbyId: string;
  lobbyCode: string;
  playerId: string;
  playerName: string;
  isHost: boolean;
  onStartGame: (matchId: string, gridData: any) => void;
  onLeave: () => void;
}

interface Player {
  id: string;
  name: string;
  avatar_url?: string;
  isReady: boolean;
  isHost: boolean;
}

export function LobbyRoom({ lobbyId, lobbyCode, playerId, playerName, isHost, onStartGame, onLeave }: LobbyRoomProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [copied, setCopied] = useState(false);
  const [myReady, setMyReady] = useState(isHost);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  // Fetch initial lobby players
  useEffect(() => {
    fetchLobbyPlayers();
  }, [lobbyId]);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`lobby:${lobbyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lobby_players',
          filter: `lobby_id=eq.${lobbyId}`
        },
        () => {
          fetchLobbyPlayers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lobbies',
          filter: `id=eq.${lobbyId}`
        },
        async (payload) => {
          // Check if game is starting
          if (payload.new.status === 'in_progress' && payload.new.match_id) {
            const { data: match } = await supabase
              .from('matches')
              .select('*')
              .eq('id', payload.new.match_id)
              .single();

            if (match) {
              onStartGame(match.id, match.grid_data);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lobbyId]);

  const fetchLobbyPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('lobby_players')
        .select('user_id, username, avatar_url, is_ready, is_host')
        .eq('lobby_id', lobbyId)
        .order('joined_at', { ascending: true });

      if (error) throw error;

      if (data) {
        setPlayers(
          data.map((p) => ({
            id: p.user_id,
            name: p.username,
            avatar_url: p.avatar_url,
            isReady: p.is_ready,
            isHost: p.is_host
          }))
        );

        // Update my ready status
        const me = data.find((p) => p.user_id === playerId);
        if (me) {
          setMyReady(me.is_ready);
        }
      }
    } catch (error) {
      console.error('Failed to fetch lobby players:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(lobbyCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleReady = async () => {
    const newReady = !myReady;
    setMyReady(newReady);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/lobby/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lobbyId,
          userId: playerId,
          isReady: newReady
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update ready status');
      }
    } catch (error) {
      console.error('Failed to update ready status:', error);
      setMyReady(!newReady); // Revert on error
    }
  };

  const handleStartGame = async () => {
    if (!canStart) return;

    setStarting(true);
    try {
      // Generate grid data
      const { generateGrid } = await import('../utils/gridGenerator');
      const gridData = generateGrid();

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/lobby/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lobbyId,
          userId: playerId,
          gridData
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start game');
      }

      const { match } = await response.json();
      onStartGame(match.id, gridData);
    } catch (error) {
      console.error('Failed to start game:', error);
      alert(error instanceof Error ? error.message : 'Failed to start game');
      setStarting(false);
    }
  };

  const handleLeave = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      await fetch(`${API_URL}/lobby/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lobbyId,
          userId: playerId
        })
      });
    } catch (error) {
      console.error('Failed to leave lobby:', error);
    }
    onLeave();
  };

  const canStart = isHost && players.length >= 2 && players.every(p => p.isReady);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-fuchsia-950 flex items-center justify-center p-8">
      <div className="max-w-3xl w-full">
        <div className="bg-purple-900/30 rounded-2xl p-8 shadow-2xl border-4 border-purple-700/50">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-green-400" />
              <h2 className="text-3xl font-bold text-white">Game Lobby</h2>
            </div>
            <button
              onClick={handleLeave}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg
                       transition-colors font-semibold flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              Leave
            </button>
          </div>

          {/* Lobby Code */}
          <div className="mb-8 text-center">
            <p className="text-purple-300 mb-2 text-sm">Share this code with friends:</p>
            <div className="flex items-center justify-center gap-3">
              <div className="bg-purple-950/70 px-8 py-4 rounded-xl border-2 border-purple-500">
                <span className="text-5xl font-bold text-white tracking-widest font-mono">
                  {lobbyCode}
                </span>
              </div>
              <button
                onClick={copyCode}
                className="p-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                title="Copy code"
              >
                {copied ? (
                  <Check className="w-6 h-6 text-white" />
                ) : (
                  <Copy className="w-6 h-6 text-white" />
                )}
              </button>
            </div>
          </div>

          {/* Players List */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-4">
              Players ({players.length}/8)
            </h3>
            {loading ? (
              <div className="text-center text-purple-400 py-8">Loading players...</div>
            ) : (
              <div className="space-y-2">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="bg-purple-950/50 p-4 rounded-lg border-2 border-purple-600/30
                             flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {player.avatar_url ? (
                        <img
                          src={player.avatar_url}
                          alt={player.name}
                          className="w-10 h-10 rounded-full border-2 border-purple-400"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500
                                      flex items-center justify-center">
                          <span className="text-white font-bold">
                            {player.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold">{player.name}</span>
                          {player.isHost && (
                            <span className="text-yellow-400 text-xs font-bold px-2 py-0.5 bg-yellow-900/30 rounded">
                              HOST
                            </span>
                          )}
                          {player.id === playerId && (
                            <span className="text-purple-400 text-sm">(You)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {player.isReady ? (
                        <span className="text-green-400 font-semibold">Ready</span>
                      ) : (
                        <span className="text-gray-400">Not Ready</span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Empty slots */}
                {Array.from({ length: 8 - players.length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="bg-purple-950/30 p-4 rounded-lg border-2 border-purple-600/20
                             flex items-center justify-center opacity-50"
                  >
                    <span className="text-purple-400">Waiting for player...</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            {!isHost && (
              <button
                onClick={toggleReady}
                className={`flex-1 px-6 py-4 rounded-lg font-bold text-lg transition-all ${
                  myReady
                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {myReady ? 'Not Ready' : 'Ready Up'}
              </button>
            )}

            {isHost && (
              <button
                onClick={handleStartGame}
                disabled={!canStart || starting}
                className={`flex-1 px-6 py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                  canStart && !starting
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Play className="w-6 h-6" />
                {starting ? 'Starting...' : 'Start Game'}
              </button>
            )}
          </div>

          {isHost && !canStart && !starting && (
            <p className="text-center text-purple-400 text-sm mt-4">
              {players.length < 2
                ? 'Need at least 2 players to start'
                : 'All players must be ready to start'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
