import { Users, X } from 'lucide-react';

interface LobbyRoomProps {
  lobbyId: string;
  playerId: string;
  playerName: string;
  isHost: boolean;
  onStartGame: () => void;
  onLeave: () => void;
}

export function LobbyRoom({ onLeave }: LobbyRoomProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-fuchsia-950 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="bg-purple-900/30 rounded-2xl p-8 shadow-2xl border-4 border-purple-700/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-green-400" />
              <h2 className="text-3xl font-bold text-white">Multiplayer Disabled</h2>
            </div>
          </div>

          <p className="text-purple-300 mb-6 text-center">
            Multiplayer features require server support. Play solo mode instead!
          </p>

          <button
            onClick={onLeave}
            className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg
                     transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
