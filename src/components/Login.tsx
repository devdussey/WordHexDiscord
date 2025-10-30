import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

export function Login() {
  const { signIn, signUp, loading: authLoading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 6) {
      return 'Password must be at least 6 characters';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const serializeError = (err: unknown) => {
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }

      if (username.trim().length < 3) {
        setError('Username must be at least 3 characters');
        return;
      }
    }

    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        await signUp(username.trim(), password);
      } else {
        await signIn(username.trim(), password);
      }
    } catch (err: any) {
      const serialized = serializeError(err);
      console.error('Auth error:', err, 'serialized:', serialized);

      const displayMessage =
        err?.message || (typeof err === 'string' ? err : serialized) || `Failed to ${isSignUp ? 'sign up' : 'sign in'}. Please try again.`;

      setError(displayMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-fuchsia-950 flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <img src="/Dorion_zIkK0aVc6b.png" alt="WordHex" className="w-48 h-48" />
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4 tracking-wider">
            WORDHEX
          </h1>
          <p className="text-purple-300 text-xl mb-8">Connect letters, create words, dominate the hexagon!</p>
        </div>

        <div className="bg-purple-900/30 rounded-2xl p-8 shadow-2xl border-4 border-purple-700/50">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setIsSignUp(false);
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                !isSignUp
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-950/50 text-purple-400 hover:bg-purple-900/50'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                isSignUp
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-950/50 text-purple-400 hover:bg-purple-900/50'
              }`}
            >
              Sign Up
            </button>
          </div>

          <p className="text-purple-200 text-center mb-6">
            {isSignUp ? 'Create a new account' : 'Sign in to your account'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-purple-200 text-sm font-semibold mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full px-4 py-3 bg-purple-950/50 border-2 border-purple-600/50 rounded-lg text-white placeholder-purple-400 focus:outline-none focus:border-pink-400 transition-colors"
                maxLength={20}
                disabled={loading || authLoading}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-purple-200 text-sm font-semibold mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 bg-purple-950/50 border-2 border-purple-600/50 rounded-lg text-white placeholder-purple-400 focus:outline-none focus:border-pink-400 transition-colors pr-12"
                  disabled={loading || authLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-purple-200 text-sm font-semibold mb-2">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full px-4 py-3 bg-purple-950/50 border-2 border-purple-600/50 rounded-lg text-white placeholder-purple-400 focus:outline-none focus:border-pink-400 transition-colors"
                  disabled={loading || authLoading}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={!username.trim() || !password || loading || authLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-all text-lg shadow-lg"
            >
              {loading || authLoading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : (isSignUp ? 'Create Account' : 'Play')}
            </button>
          </form>

          {isSignUp && (
            <div className="text-purple-400 text-xs text-center mt-4 space-y-1">
              <p className="font-semibold">Password Requirements:</p>
              <ul className="list-disc list-inside text-left max-w-xs mx-auto">
                <li>At least 6 characters</li>
                <li>One uppercase letter (A-Z)</li>
                <li>One lowercase letter (a-z)</li>
                <li>One number (0-9)</li>
              </ul>
              <p className="mt-2">Username must be unique and at least 3 characters</p>
            </div>
          )}
          {!isSignUp && (
            <p className="text-purple-400 text-sm text-center mt-4">
              Your session will be saved securely
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
