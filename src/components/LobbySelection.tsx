import { useState } from 'react';
import { Users, Dices, ArrowLeft, Hash } from 'lucide-react';
import { ActiveSessionsList } from './ActiveSessionsList';

interface LobbySelectionProps {
  onJoinRandom: () => void;
  onStartLobby: () => void;
  onJoinSession: (sessionId: string) => void;
  onBack: () => void;
  serverId?: string;
}

export function LobbySelection({ onJoinRandom, onStartLobby, onJoinSession, onBack, serverId }: LobbySelectionProps) {
  const [joinCode, setJoinCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const handleJoinWithCode = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 4) {
      setCodeError('Code must be 4 digits');
      return;
    }
    if (!/^\d{4}$/.test(code)) {
      setCodeError('Code must contain only numbers');
      return;
    }
    setCodeError('');
    onJoinSession(code);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-fuchsia-950 p-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 px-6 py-3 bg-purple-800/50 hover:bg-purple-700/50 text-white rounded-xl
                   font-semibold transition-all flex items-center gap-2 shadow-lg border-2 border-purple-600/30"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Menu
        </button>

        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Choose Game Mode</h1>
          <p className="text-purple-300 text-lg">Join a match or create your own lobby</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <button
                onClick={onJoinRandom}
                className="bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700
                         rounded-2xl p-8 shadow-2xl border-4 border-white/10
                         transform transition-all duration-200
                         hover:scale-105 hover:shadow-3xl active:scale-95
                         group"
              >
                <div className="flex flex-col items-center gap-4">
                  <Dices className="w-16 h-16 text-white group-hover:scale-110 transition-transform" />
                  <span className="text-3xl font-bold text-white">Join Random</span>
                  <p className="text-white/80 text-sm">Match with up to 7 other players</p>
                </div>
              </button>

              <button
                onClick={onStartLobby}
                className="bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700
                         rounded-2xl p-8 shadow-2xl border-4 border-white/10
                         transform transition-all duration-200
                         hover:scale-105 hover:shadow-3xl active:scale-95
                         group"
              >
                <div className="flex flex-col items-center gap-4">
                  <Users className="w-16 h-16 text-white group-hover:scale-110 transition-transform" />
                  <span className="text-3xl font-bold text-white">Start Lobby</span>
                  <p className="text-white/80 text-sm">Create your own room (Max 8 players)</p>
                </div>
              </button>
            </div>

            {/* Join with Code */}
            <div className="bg-purple-900/30 rounded-2xl p-6 shadow-2xl border-4 border-purple-700/50">
              <div className="flex items-center gap-3 mb-4">
                <Hash className="w-6 h-6 text-purple-400" />
                <h3 className="text-2xl font-bold text-white">Join with Code</h3>
              </div>
              <p className="text-purple-300 mb-4">Enter a 4-digit lobby code</p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setJoinCode(value);
                    setCodeError('');
                  }}
                  placeholder="1234"
                  maxLength={4}
                  className="flex-1 px-6 py-4 bg-purple-950/50 border-2 border-purple-600/50 rounded-lg
                           text-white text-3xl font-mono text-center tracking-widest
                           placeholder-purple-500 focus:outline-none focus:border-pink-400 transition-colors"
                />
                <button
                  onClick={handleJoinWithCode}
                  disabled={joinCode.length !== 4}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600
                           hover:from-purple-700 hover:to-pink-700
                           disabled:opacity-50 disabled:cursor-not-allowed
                           text-white font-bold rounded-lg transition-all"
                >
                  Join
                </button>
              </div>
              {codeError && (
                <p className="text-red-400 text-sm mt-2">{codeError}</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            {serverId && (
              <ActiveSessionsList
                serverId={serverId}
                onJoinSession={onJoinSession}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
