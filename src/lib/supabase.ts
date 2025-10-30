import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'wordhex-discord-activity',
    },
  },
});

export interface User {
  id: string;
  discord_id: string;
  username: string;
  coins: number;
  gems: number;
  cosmetics: string[];
  created_at: string;
  updated_at: string;
}

export interface Lobby {
  id: string;
  host_id: string;
  status: 'waiting' | 'playing' | 'finished';
  max_players: number;
  current_players: number;
  game_data: Record<string, unknown>;
  created_at: string;
  started_at?: string;
  finished_at?: string;
}

export interface LobbyPlayer {
  id: string;
  lobby_id: string;
  player_id: string;
  player_name: string;
  score: number;
  is_ready: boolean;
  joined_at: string;
  left_at?: string;
}
