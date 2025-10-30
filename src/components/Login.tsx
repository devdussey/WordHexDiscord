import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const { user, loading, refreshIdentity } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-fuchsia-950 flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="flex items-center justify-center mb-6">
          <img src="/Dorion_zIkK0aVc6b.png" alt="WordHex" className="w-48 h-48" />
        </div>

        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
          WORDHEX
        </h1>
        <p className="text-purple-200 text-lg mb-8">Auto-identifying your Discord session…</p>

        <div className="bg-purple-900/30 rounded-2xl p-8 shadow-2xl border-4 border-purple-700/50 text-left space-y-4">
          <div>
            <p className="text-sm text-purple-300 uppercase tracking-widest mb-1">Status</p>
            <p className="text-white text-xl font-semibold">
              {loading ? 'Syncing profile…' : 'Linked to Discord'}
            </p>
          </div>

          {user && (
            <div>
              <p className="text-sm text-purple-300 uppercase tracking-widest mb-1">Player</p>
              <p className="text-white text-2xl font-bold">{user.username}</p>
              {user.discordId && (
                <p className="text-purple-200 text-sm mt-1">Discord ID: {user.discordId}</p>
              )}
            </div>
          )}

          <button
            onClick={() => refreshIdentity()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition-all"
            disabled={loading}
          >
            {loading ? 'Please wait…' : 'Re-check Discord Identity'}
          </button>

          <p className="text-purple-300 text-xs text-center mt-2">
            WordHex now links to your Discord account automatically—no password required.
          </p>
        </div>
      </div>
    </div>
  );
}
