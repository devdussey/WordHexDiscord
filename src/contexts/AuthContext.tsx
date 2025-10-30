import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { hashPassword, verifyPassword } from '../utils/crypto';

interface UserProfile {
  id: string;
  username: string;
  discordId?: string;
  coins: number;
  gems: number;
  cosmetics: string[];
  createdAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getUsername: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = 'wordhex_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const serializeError = (err: unknown) => {
    try {
      return JSON.stringify(err);
    } catch (e) {
      return String(err);
    }
  };

  const checkSession = async () => {
    try {
      const sessionData = localStorage.getItem(STORAGE_KEY);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.userId)
          .maybeSingle();

        if (!error && data) {
          setUser({
            id: data.id,
            username: data.username,
            discordId: data.discord_id,
            coins: data.coins,
            gems: data.gems,
            cosmetics: data.cosmetics,
            createdAt: data.created_at
          });
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error checking session:', error, 'serialized:', serializeError(error));
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (username: string, password: string) => {
    setLoading(true);
    try {
      const trimmedUsername = username.trim();

      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .ilike('username', trimmedUsername)
        .maybeSingle();

      if (existingUser) {
        throw new Error('Username already taken');
      }

      const passwordHash = await hashPassword(password);

      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          username: trimmedUsername,
          discord_id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          password_hash: passwordHash,
          coins: 100,
          gems: 10,
          cosmetics: []
        })
        .select()
        .single();

      if (error) throw error;

      if (newUser) {
        // Create player_stats entry for the new user
        const { error: statsError } = await supabase
          .from('player_stats')
          .insert({
            user_id: newUser.id,
            total_matches: 0,
            total_wins: 0,
            total_score: 0,
            total_words: 0,
            best_score: 0,
            win_streak: 0,
            best_win_streak: 0
          });

        if (statsError) {
          console.error('Failed to create player_stats:', statsError);
          // Don't throw - user is created, stats can be created later
        }

        setUser({
          id: newUser.id,
          username: newUser.username,
          discordId: newUser.discord_id,
          coins: newUser.coins,
          gems: newUser.gems,
          cosmetics: newUser.cosmetics,
          createdAt: newUser.created_at
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId: newUser.id }));
      }
    } catch (error: any) {
      const serialized = serializeError(error);
      console.error('Sign up error:', error, 'serialized:', serialized);

      const message =
        error?.message || (typeof error === 'string' ? error : serialized) || 'Failed to sign up';

      const errToThrow = new Error(message);
      (errToThrow as any).original = error;
      throw errToThrow;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (username: string, password: string) => {
    setLoading(true);
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .ilike('username', username.trim())
        .maybeSingle();

      if (error || !userData) {
        throw new Error('Invalid username or password');
      }

      if (!userData.password_hash) {
        throw new Error('Account does not have a password set');
      }

      const isValid = await verifyPassword(password, userData.password_hash);
      if (!isValid) {
        throw new Error('Invalid username or password');
      }

      setUser({
        id: userData.id,
        username: userData.username,
        discordId: userData.discord_id,
        coins: userData.coins,
        gems: userData.gems,
        cosmetics: userData.cosmetics,
        createdAt: userData.created_at
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId: userData.id }));
    } catch (error: any) {
      const serialized = serializeError(error);
      console.error('Sign in error:', error, 'serialized:', serialized);

      const message =
        error?.message || (typeof error === 'string' ? error : serialized) || 'Failed to sign in';

      const errToThrow = new Error(message);
      (errToThrow as any).original = error;
      throw errToThrow;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getUsername = () => {
    return user?.username || 'Player';
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, getUsername }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
