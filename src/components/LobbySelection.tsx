import { Users, Dices, ArrowLeft } from 'lucide-react';
import { ActiveSessionsList } from './ActiveSessionsList';

interface LobbySelectionProps {
  onJoinRandom: () => void;
  onStartLobby: () => void;
  onJoinSession: (sessionId: string) => void;
  onBack: () => void;
  serverId?: string;
}

export function LobbySelection({ onJoinRandom, onStartLobby, onJoinSession, onBack, serverId }: LobbySelectionProps) {
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
