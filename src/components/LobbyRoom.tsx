import { useState, useEffect } from 'react';
import { Users, X, Copy, Check, Play } from 'lucide-react';

interface LobbyRoomProps {
  lobbyId: string;
  playerId: string;
  playerName: string;
  isHost: boolean;
  onStartGame: () => void;
  onLeave: () => void;
}

interface Player {
  id: string;
  name: string;
  isReady: boolean;
}

export function LobbyRoom({ lobbyId, playerId, playerName, isHost, onStartGame, onLeave }: LobbyRoomProps) {
  const [players, setPlayers] = useState<Player[]>([
    { id: playerId, name: playerName, isReady: isHost }
  ]);
  const [copied, setCopied] = useState(false);
  const [myReady, setMyReady] = useState(isHost);

  const copyCode = () => {
    navigator.clipboard.writeText(lobbyId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleReady = () => {
    setMyReady(!myReady);
    // TODO: Send ready status to server
  };

  const canStart = isHost && players.length >= 1 && players.every(p => p.isReady);

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
              onClick={onLeave}
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
                  {lobbyId}
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
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="bg-purple-950/50 p-4 rounded-lg border-2 border-purple-600/30
                           flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500
                                  flex items-center justify-center">
                      <span className="text-white font-bold">
                        {player.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-white font-semibold">{player.name}</span>
                    {player.id === playerId && (
                      <span className="text-purple-400 text-sm">(You)</span>
                    )}
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
                onClick={onStartGame}
                disabled={!canStart}
                className={`flex-1 px-6 py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                  canStart
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Play className="w-6 h-6" />
                Start Game
              </button>
            )}
          </div>

          {isHost && !canStart && (
            <p className="text-center text-purple-400 text-sm mt-4">
              All players must be ready to start
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
