import { Trophy, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LeaderboardProps {
  onBack: () => void;
}

export function Leaderboard({ onBack }: LeaderboardProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Menu
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">Leaderboard</h1>
          <p className="text-slate-400 text-lg">Top Players by Total Score</p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-12 text-center border-2 border-slate-700">
          <Trophy className="w-24 h-24 mx-auto mb-4 text-slate-600 opacity-50" />
          <p className="text-white text-xl mb-2">Leaderboard Coming Soon</p>
          <p className="text-slate-400">
            Play matches to compete for the top spot!
          </p>
        </div>

        {user && (
          <div className="mt-8 bg-slate-800/50 rounded-xl p-6 shadow-lg border-2 border-slate-700">
            <h2 className="text-xl font-bold text-white mb-3">Your Stats</h2>
            <div className="text-slate-300 space-y-2">
              <p>Username: {user.username}</p>
              <p>Coins: {user.coins}</p>
              <p>Gems: {user.gems}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
