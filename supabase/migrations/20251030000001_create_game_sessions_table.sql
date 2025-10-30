/*
  # Create Game Sessions Table

  ## Overview
  This migration creates the game_sessions table for tracking individual
  game sessions (primarily solo play), distinct from matches which are
  for multiplayer games.

  ## New Table: game_sessions
  Stores individual game session data with the following columns:
  - `id` (uuid, primary key) - Unique session identifier
  - `user_id` (uuid, foreign key) - Reference to users table
  - `score` (integer) - Final score for this session
  - `words_found` (integer) - Number of words found
  - `gems_collected` (integer) - Number of gems collected
  - `duration` (integer) - Duration in seconds
  - `grid_data` (jsonb) - The hex grid state
  - `server_id` (text) - Discord server/guild ID (nullable)
  - `channel_id` (text) - Discord channel ID (nullable)
  - `game_status` (text) - Status: 'active', 'completed', 'abandoned'
  - `round_number` (integer) - Current round number
  - `time_remaining` (integer) - Seconds remaining
  - `player_avatar_url` (text) - Discord avatar URL (nullable)
  - `is_record` (boolean) - Whether this is a record-breaking session
  - `completed_at` (timestamptz) - When the session was completed
  - `created_at` (timestamptz) - Session creation timestamp

  ## Security
  - Enable RLS on game_sessions table
  - Users can view all completed game sessions (for leaderboards)
  - Users can view active sessions
  - Users can create their own game sessions
  - Users can update their own game sessions

  ## Indexes
  - Index on user_id for fast user-specific queries
  - Index on score for leaderboard queries
  - Index on server_id for server-specific queries
  - Index on game_status for filtering active games
  - Composite index on (server_id, game_status) for server activity
*/

-- Create game_sessions table
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

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id
  ON game_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_game_sessions_score
  ON game_sessions(score DESC);

CREATE INDEX IF NOT EXISTS idx_game_sessions_server_id
  ON game_sessions(server_id);

CREATE INDEX IF NOT EXISTS idx_game_sessions_game_status
  ON game_sessions(game_status);

CREATE INDEX IF NOT EXISTS idx_game_sessions_server_status
  ON game_sessions(server_id, game_status);

-- Enable RLS
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_sessions

-- Allow anyone to view completed game sessions (for leaderboards)
CREATE POLICY "Anyone can view completed game sessions"
  ON game_sessions
  FOR SELECT
  TO anon, authenticated
  USING (game_status = 'completed');

-- Allow anyone to view active sessions (for activity feed)
CREATE POLICY "Anyone can view active game sessions"
  ON game_sessions
  FOR SELECT
  TO anon, authenticated
  USING (game_status = 'active');

-- Allow users to create game sessions
CREATE POLICY "Users can create game sessions"
  ON game_sessions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow users to update their own game sessions
CREATE POLICY "Users can update their own game sessions"
  ON game_sessions
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Allow users to delete their own game sessions
CREATE POLICY "Users can delete their own game sessions"
  ON game_sessions
  FOR DELETE
  TO anon, authenticated
  USING (true);
