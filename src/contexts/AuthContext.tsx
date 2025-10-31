import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, realtime } from '../services/api';

interface UserProfile {
  id: string;
  username: string;
  discordId?: string | null;
  coins: number;
  gems: number;
  cosmetics: string[];
  createdAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  getUsername: () => string;
  refreshIdentity: () => Promise<void>;
  loginAsGuest: (username: string) => Promise<void>;
}

type DiscordIdentity = {
  id?: string;
  username?: string;
  discriminator?: string;
  global_name?: string | null;
};

type ExtendedWindow = Window &
  typeof globalThis & {
    __WORDHEX_DISCORD_USER__?: DiscordIdentity;
    __discordUser?: DiscordIdentity;
  };

const STORAGE_KEY = 'wordhex_profile';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readDiscordIdentity(): DiscordIdentity | null {
  const extendedWindow = window as ExtendedWindow;
  return extendedWindow.__WORDHEX_DISCORD_USER__ ?? extendedWindow.__discordUser ?? null;
}

function getStoredProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

function persistProfile(profile: UserProfile | null) {
  if (profile) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(getStoredProfile());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      realtime.connect(user.id, user.username);
    }
  }, [user]);

  const registerWithServer = useCallback(async () => {
    const identity = readDiscordIdentity();
    const payload = {
      discordId: identity?.id,
      username:
        identity?.global_name ||
        identity?.username ||
        `Player-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    };
    const response = await api.auth.register(payload);
    const profile = response.user as UserProfile;
    setUser(profile);
    persistProfile(profile);
    realtime.connect(profile.id, profile.username);
  }, []);

  const initialize = useCallback(async () => {
    setLoading(true);
    try {
      if (user) {
        realtime.connect(user.id, user.username);
        setLoading(false);
        return;
      }
      try {
        await registerWithServer();
      } catch (error) {
        console.warn('Discord registration failed, creating guest', error);
        const result = await api.auth.guest();
        const profile = result.user as UserProfile;
        setUser(profile);
        persistProfile(profile);
        realtime.connect(profile.id, profile.username);
      }
    } finally {
      setLoading(false);
    }
  }, [registerWithServer, user]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const signOut = useCallback(async () => {
    api.auth.clearToken();
    persistProfile(null);
    setUser(null);
    realtime.disconnect();
    await initialize();
  }, [initialize]);

  const refreshIdentity = useCallback(async () => {
    api.auth.clearToken();
    persistProfile(null);
    setUser(null);
    await initialize();
  }, [initialize]);

  const loginAsGuest = useCallback(async (username: string) => {
    setLoading(true);
    try {
      api.auth.clearToken();
      persistProfile(null);
      const payload = { username };
      const response = await api.auth.register(payload);
      const profile = response.user as UserProfile;
      setUser(profile);
      persistProfile(profile);
      realtime.connect(profile.id, profile.username);
    } finally {
      setLoading(false);
    }
  }, []);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      signOut,
      refreshIdentity,
      loginAsGuest,
      getUsername: () => user?.username || 'Player',
    }),
    [user, loading, signOut, refreshIdentity, loginAsGuest]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
