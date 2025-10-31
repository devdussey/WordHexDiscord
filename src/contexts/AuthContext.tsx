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
  loginWithDiscord: () => Promise<void>;
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
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      realtime.connect(user.id, user.username);
    } else {
      realtime.disconnect();
    }
  }, [user]);

  const completeLogin = useCallback((profile: UserProfile) => {
    setUser(profile);
    persistProfile(profile);
    realtime.connect(profile.id, profile.username);
  }, []);

  const loginWithDiscord = useCallback(async () => {
    setLoading(true);
    try {
      api.auth.clearToken();
      const identity = readDiscordIdentity();
      if (!identity || (!identity.id && !identity.username && !identity.global_name)) {
        throw new Error('Discord identity not available');
      }
      const payload = {
        discordId: identity.id,
        username:
          identity.global_name ||
          identity.username ||
          `Player-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      };
      const response = await api.auth.register(payload);
      completeLogin(response.user as UserProfile);
    } finally {
      setLoading(false);
    }
  }, [completeLogin]);

  const signOut = useCallback(async () => {
    api.auth.clearToken();
    persistProfile(null);
    setUser(null);
    realtime.disconnect();
  }, []);

  const loginAsGuest = useCallback(async (username: string) => {
    setLoading(true);
    try {
      api.auth.clearToken();
      persistProfile(null);
      const payload = { username };
      const response = await api.auth.register(payload);
      completeLogin(response.user as UserProfile);
    } finally {
      setLoading(false);
    }
  }, [completeLogin]);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      signOut,
      loginWithDiscord,
      loginAsGuest,
      getUsername: () => user?.username || 'Player',
    }),
    [user, loading, signOut, loginWithDiscord, loginAsGuest]
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
