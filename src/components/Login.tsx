import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User } from 'lucide-react';

export function Login() {
  const { user, loading, loginWithDiscord, loginAsGuest } = useAuth();
  const [username, setUsername] = useState('');
  const [isCustomUsername, setIsCustomUsername] = useState(false);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length >= 3) {
      await loginAsGuest(username.trim());
    }
  };

  if (isCustomUsername) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-fuchsia-950 flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <div className="flex items-center justify-center mb-6">
            <img src="/Dorion_zIkK0aVc6b.png" alt="WordHex" className="w-48 h-48" />
          </div>

          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
            WORDHEX
          </h1>
          <p className="text-purple-200 text-lg mb-8">Choose Your Username</p>

          <form onSubmit={handleUsernameSubmit} className="bg-purple-900/30 rounded-2xl p-8 shadow-2xl border-4 border-purple-700/50 space-y-6">
            <div className="text-left">
              <label className="text-sm text-purple-300 uppercase tracking-widest mb-2 block">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username..."
                  minLength={3}
                  maxLength={20}
                  className="w-full pl-12 pr-4 py-3 bg-purple-950/50 border-2 border-purple-600/50 rounded-lg text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
                  autoFocus
                />
              </div>
              <p className="text-purple-300 text-xs mt-2">
                3-20 characters
              </p>
            </div>

            <button
              type="submit"
              disabled={username.trim().length < 3}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-purple-900/50 disabled:to-purple-900/50 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-all disabled:cursor-not-allowed"
            >
              Start Playing
            </button>

            <button
              type="button"
              onClick={() => setIsCustomUsername(false)}
              className="w-full text-purple-300 hover:text-white text-sm transition-colors"
            >
              ← Back
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-fuchsia-950 flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="flex items-center justify-center mb-6">
          <img src="/Dorion_zIkK0aVc6b.png" alt="WordHex" className="w-48 h-48" />
        </div>

        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
          WORDHEX
        </h1>
        <p className="text-purple-200 text-lg mb-8">Welcome! Choose how to play:</p>

        <div className="bg-purple-900/30 rounded-2xl p-8 shadow-2xl border-4 border-purple-700/50 space-y-4">
          {user && (
            <div className="mb-6 pb-6 border-b border-purple-700/50">
              <p className="text-sm text-purple-300 uppercase tracking-widest mb-1">Current Player</p>
              <p className="text-white text-2xl font-bold">{user.username}</p>
              {user.discordId && (
                <p className="text-purple-200 text-sm mt-1">Discord ID: {user.discordId}</p>
              )}
            </div>
          )}

          <button
            onClick={() => setIsCustomUsername(true)}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-4 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg"
          >
            <User className="w-5 h-5 inline mr-2" />
            Play with Custom Username
          </button>

          <button
            onClick={() => loginWithDiscord()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg"
            disabled={loading}
          >
            {loading ? 'Please wait…' : 'Use Discord Identity'}
          </button>

          <p className="text-purple-300 text-xs text-center mt-4">
            No account needed—just pick a username and start playing!
          </p>
        </div>
      </div>
    </div>
  );
}
