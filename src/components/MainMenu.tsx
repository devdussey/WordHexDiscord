import { Play, BarChart3, Settings, ShoppingBag, Trophy, History, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface MainMenuProps {
  onNavigate: (page: 'play' | 'statistics' | 'leaderboard' | 'match-history' | 'options' | 'shop') => void;
}

export function MainMenu({ onNavigate }: MainMenuProps) {
  const { getUsername, signOut } = useAuth();
  const menuItems = [
    {
      id: 'play' as const,
      label: 'Play',
      icon: Play,
      gradient: 'from-green-600 to-emerald-600',
      hoverGradient: 'hover:from-green-700 hover:to-emerald-700'
    },
    {
      id: 'leaderboard' as const,
      label: 'Leaderboard',
      icon: Trophy,
      gradient: 'from-yellow-500 to-orange-600',
      hoverGradient: 'hover:from-yellow-600 hover:to-orange-700'
    },
    {
      id: 'match-history' as const,
      label: 'Match History',
      icon: History,
      gradient: 'from-blue-600 to-cyan-600',
      hoverGradient: 'hover:from-blue-700 hover:to-cyan-700'
    },
    {
      id: 'statistics' as const,
      label: 'Statistics',
      icon: BarChart3,
      gradient: 'from-teal-600 to-blue-600',
      hoverGradient: 'hover:from-teal-700 hover:to-blue-700'
    },
    {
      id: 'options' as const,
      label: 'Options',
      icon: Settings,
      gradient: 'from-slate-600 to-slate-700',
      hoverGradient: 'hover:from-slate-700 hover:to-slate-800'
    },
    {
      id: 'shop' as const,
      label: 'Shop',
      icon: ShoppingBag,
      gradient: 'from-pink-600 to-rose-600',
      hoverGradient: 'hover:from-pink-700 hover:to-rose-700'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-fuchsia-950 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="absolute top-8 right-8 flex items-center gap-4">
          <span className="text-white font-semibold">{getUsername()}</span>
          <button
            onClick={signOut}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg
                     transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        <div className="text-center mb-12 animate-fadeIn">
          <div className="flex items-center justify-center mb-6">
            <img src="/Dorion_zIkK0aVc6b.png" alt="WordHex" className="w-64 h-64" />
          </div>
          <h1 className="text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4 tracking-wider">
            WORDHEX
          </h1>
          <p className="text-purple-300 text-xl">Connect letters, create words, dominate the hexagon!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  bg-gradient-to-br ${item.gradient} ${item.hoverGradient}
                  rounded-2xl p-6 shadow-2xl border-4 border-white/10
                  transform transition-all duration-200
                  hover:scale-105 hover:shadow-3xl active:scale-95
                  group
                `}
                aria-label={`Navigate to ${item.label}`}
              >
                <div className="flex flex-col items-center gap-3">
                  <Icon className="w-12 h-12 text-white group-hover:scale-110 transition-transform" aria-hidden="true" />
                  <span className="text-2xl font-bold text-white">{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <div className="bg-purple-900/30 rounded-xl p-6 shadow-lg border-2 border-purple-700/50">
            <p className="text-purple-300 text-sm">
              Hexagonal word puzzle for Discord Activities
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
