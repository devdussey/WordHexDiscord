import { Trophy } from 'lucide-react';

interface Player {
  id: string;
  username: string;
  avatar?: string;
  score: number;
}

interface PlayerLeaderboardProps {
  players: Player[];
}

export function PlayerLeaderboard({ players }: PlayerLeaderboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-purple-900/30 rounded-xl p-6 shadow-lg border-2 border-purple-700/50">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-6 h-6 text-yellow-400" />
        <h3 className="text-xl font-bold text-white">Leaderboard</h3>
      </div>

      <div className="space-y-3">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
              index === 0
                ? 'bg-gradient-to-r from-yellow-600/30 to-yellow-700/30 border-2 border-yellow-500/50'
                : 'bg-purple-800/30 border-2 border-purple-600/30'
            }`}
          >
            <div className="flex items-center gap-3 flex-1">
              {player.avatar ? (
                <img
                  src={player.avatar}
                  alt={player.username}
                  className="w-10 h-10 rounded-full border-2 border-purple-400"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold border-2 border-purple-400">
                  {player.username[0].toUpperCase()}
                </div>
              )}
              <span className="text-white font-semibold truncate flex-1">
                {player.username}
              </span>
            </div>
            <div className="text-right">
              <span className={`text-2xl font-bold ${
                index === 0 ? 'text-yellow-400' : 'text-purple-300'
              }`}>
                {player.score}
              </span>
              <span className="text-purple-400 text-sm ml-1">pts</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
