-- ============================================================================
-- LOBBIES TABLE - For multiplayer matchmaking and waiting rooms
-- ============================================================================

CREATE TABLE IF NOT EXISTS lobbies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_code text UNIQUE NOT NULL,
  host_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  server_id text,
  channel_id text,
  max_players integer DEFAULT 8 NOT NULL,
  current_players integer DEFAULT 1 NOT NULL,
  status text DEFAULT 'waiting' NOT NULL, -- waiting, starting, in_progress, completed
  match_id uuid REFERENCES matches(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  started_at timestamptz,
  CONSTRAINT max_players_check CHECK (max_players >= 2 AND max_players <= 8),
  CONSTRAINT current_players_check CHECK (current_players >= 0 AND current_players <= max_players)
);

-- ============================================================================
-- LOBBY_PLAYERS TABLE - Tracks players in each lobby
-- ============================================================================

CREATE TABLE IF NOT EXISTS lobby_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id uuid REFERENCES lobbies(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  username text NOT NULL,
  avatar_url text,
  is_ready boolean DEFAULT false NOT NULL,
  is_host boolean DEFAULT false NOT NULL,
  joined_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(lobby_id, user_id)
);

-- ============================================================================
-- MATCHMAKING_QUEUE TABLE - For random matchmaking
-- ============================================================================

CREATE TABLE IF NOT EXISTS matchmaking_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  username text NOT NULL,
  avatar_url text,
  server_id text,
  searching_since timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_lobbies_code ON lobbies(lobby_code);
CREATE INDEX IF NOT EXISTS idx_lobbies_status ON lobbies(status);
CREATE INDEX IF NOT EXISTS idx_lobbies_server_id ON lobbies(server_id);
CREATE INDEX IF NOT EXISTS idx_lobby_players_lobby_id ON lobby_players(lobby_id);
CREATE INDEX IF NOT EXISTS idx_lobby_players_user_id ON lobby_players(user_id);
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_server_id ON matchmaking_queue(server_id);
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_searching_since ON matchmaking_queue(searching_since);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Lobbies
ALTER TABLE lobbies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lobbies"
  ON lobbies FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create lobbies"
  ON lobbies FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update lobbies"
  ON lobbies FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete lobbies"
  ON lobbies FOR DELETE
  TO anon, authenticated
  USING (true);

-- Lobby Players
ALTER TABLE lobby_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lobby players"
  ON lobby_players FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can join lobbies"
  ON lobby_players FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update lobby player status"
  ON lobby_players FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can leave lobbies"
  ON lobby_players FOR DELETE
  TO anon, authenticated
  USING (true);

-- Matchmaking Queue
ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view matchmaking queue"
  ON matchmaking_queue FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can join matchmaking"
  ON matchmaking_queue FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can leave matchmaking"
  ON matchmaking_queue FOR DELETE
  TO anon, authenticated
  USING (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to generate a unique 4-digit lobby code
CREATE OR REPLACE FUNCTION generate_lobby_code()
RETURNS text AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    new_code := LPAD((FLOOR(RANDOM() * 10000)::integer)::text, 4, '0');

    SELECT EXISTS(
      SELECT 1 FROM lobbies
      WHERE lobby_code = new_code
      AND status IN ('waiting', 'starting')
    ) INTO code_exists;

    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

-- Function to auto-cleanup old lobbies (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_lobbies()
RETURNS void AS $$
BEGIN
  DELETE FROM lobbies
  WHERE created_at < NOW() - INTERVAL '1 hour'
  AND status IN ('waiting', 'starting');
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

-- Function to auto-cleanup matchmaking queue (older than 10 minutes)
CREATE OR REPLACE FUNCTION cleanup_matchmaking_queue()
RETURNS void AS $$
BEGIN
  DELETE FROM matchmaking_queue
  WHERE searching_since < NOW() - INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;
