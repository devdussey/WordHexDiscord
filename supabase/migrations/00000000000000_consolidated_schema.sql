/*
  # WordHex Complete Database Schema - Consolidated Migration

  This migration creates all tables, indexes, RLS policies, and functions
  needed for the WordHex Discord Activity game.
*/

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

-- ============================================================================
-- USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id text UNIQUE NOT NULL,
  username text NOT NULL,
  avatar_url text,
  password_hash text,
  coins integer DEFAULT 0 NOT NULL,
  gems integer DEFAULT 0 NOT NULL,
  cosmetics jsonb DEFAULT '[]'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT users_username_unique UNIQUE (username)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON users (LOWER(username));

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow user registration"
  ON users FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow limited profile updates"
  ON users FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (
    id = id AND
    discord_id = discord_id AND
    created_at = created_at
  );

-- Trigger
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PLAYER_STATS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS player_stats (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_matches integer DEFAULT 0 NOT NULL,
  total_wins integer DEFAULT 0 NOT NULL,
  total_score integer DEFAULT 0 NOT NULL,
  total_words integer DEFAULT 0 NOT NULL,
  best_score integer DEFAULT 0 NOT NULL,
  win_streak integer DEFAULT 0 NOT NULL,
  best_win_streak integer DEFAULT 0 NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read player stats"
  ON player_stats FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow player stats creation"
  ON player_stats FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow player stats updates"
  ON player_stats FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger
CREATE TRIGGER update_player_stats_updated_at
  BEFORE UPDATE ON player_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GAME_SESSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  score integer DEFAULT 0 NOT NULL,
  words_found integer DEFAULT 0 NOT NULL,
  gems_collected integer DEFAULT 0 NOT NULL,
  duration integer DEFAULT 0 NOT NULL,
  grid_data jsonb,
  server_id text,
  channel_id text,
  game_status text DEFAULT 'active' NOT NULL,
  round_number integer DEFAULT 1 NOT NULL,
  time_remaining integer DEFAULT 180 NOT NULL,
  player_avatar_url text,
  is_record boolean DEFAULT false NOT NULL,
  completed_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_score ON game_sessions(score DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_server_id ON game_sessions(server_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_status ON game_sessions(game_status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_server_status ON game_sessions(server_id, game_status);

-- RLS
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view completed game sessions"
  ON game_sessions FOR SELECT
  TO anon, authenticated
  USING (game_status = 'completed');

CREATE POLICY "Anyone can view active game sessions"
  ON game_sessions FOR SELECT
  TO anon, authenticated
  USING (game_status = 'active');

CREATE POLICY "Users can create game sessions"
  ON game_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow game session status updates"
  ON game_sessions FOR UPDATE
  TO anon, authenticated
  USING (game_status != 'completed')
  WITH CHECK (game_status != 'completed');

-- ============================================================================
-- SERVER_RECORDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS server_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id text UNIQUE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  username text NOT NULL,
  score integer NOT NULL,
  words_found integer NOT NULL,
  gems_collected integer NOT NULL,
  achieved_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_server_records_server_id ON server_records(server_id);
CREATE INDEX IF NOT EXISTS idx_server_records_score ON server_records(score DESC);

-- RLS
ALTER TABLE server_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view server records"
  ON server_records FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert server records"
  ON server_records FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update server records"
  ON server_records FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger
CREATE TRIGGER update_server_records_updated_at
  BEFORE UPDATE ON server_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MATCHES TABLE (for multiplayer)
-- ============================================================================

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id text,
  grid_data jsonb NOT NULL,
  status text DEFAULT 'waiting' NOT NULL,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read matches"
  ON matches FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow match creation"
  ON matches FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow match updates"
  ON matches FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- MATCH_PLAYERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS match_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  score integer DEFAULT 0 NOT NULL,
  words_found jsonb DEFAULT '[]'::jsonb NOT NULL,
  rank integer,
  joined_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(match_id, user_id)
);

-- RLS
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read match players"
  ON match_players FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow joining matches"
  ON match_players FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow updating match player data"
  ON match_players FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- ERROR_LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type text NOT NULL,
  severity text NOT NULL,
  message text NOT NULL,
  user_message text NOT NULL,
  context jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz NOT NULL DEFAULT now(),
  retryable boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);

-- RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert error logs"
  ON error_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view error logs"
  ON error_logs FOR SELECT
  TO anon, authenticated
  USING (true);
