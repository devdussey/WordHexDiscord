import { Loader2, X } from 'lucide-react';

interface MatchmakingQueueProps {
  playerName: string;
  onMatchFound: (lobbyId: string) => void;
  onCancel: () => void;
}

export function MatchmakingQueue({ onCancel }: MatchmakingQueueProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-fuchsia-950 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-purple-900/30 rounded-2xl p-8 shadow-2xl border-4 border-purple-700/50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-400 mx-auto mb-6 animate-spin" />
          <h2 className="text-3xl font-bold text-white mb-4">Multiplayer Disabled</h2>
          <p className="text-purple-300 mb-6">
            Multiplayer features require server support. Play solo mode instead!
          </p>

          <button
            onClick={onCancel}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg
                     transition-colors font-semibold flex items-center gap-2 mx-auto"
          >
            <X className="w-5 h-5" />
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
