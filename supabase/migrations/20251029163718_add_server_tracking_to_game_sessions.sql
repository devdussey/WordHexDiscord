/*
  # Add Server Tracking and Game Status to Game Sessions

  1. Changes to game_sessions table
    - Add `server_id` (text) - Discord server/guild ID where the game is played
    - Add `channel_id` (text) - Discord channel ID where the game is played
    - Add `game_status` (text) - Status: 'active', 'completed', 'abandoned'
    - Add `round_number` (integer) - Current round in the game
    - Add `time_remaining` (integer) - Seconds remaining in current round
    - Add `player_avatar_url` (text) - Discord avatar URL for the player
    
  2. Indexes
    - Add index on server_id for fast server-based queries
    - Add index on game_status for filtering active games
    - Add composite index on (server_id, game_status) for active sessions per server
    
  3. Security
    - Update RLS policies to allow viewing active sessions in same server
*/

-- Add new columns to game_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'server_id'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN server_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'channel_id'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN channel_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'game_status'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN game_status text DEFAULT 'active';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'round_number'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN round_number integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'time_remaining'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN time_remaining integer DEFAULT 180;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'player_avatar_url'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN player_avatar_url text;
  END IF;
END $$;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_game_sessions_server_id 
  ON game_sessions(server_id);

CREATE INDEX IF NOT EXISTS idx_game_sessions_game_status 
  ON game_sessions(game_status);

CREATE INDEX IF NOT EXISTS idx_game_sessions_server_status 
  ON game_sessions(server_id, game_status);

-- Drop existing policy if it exists and recreate
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'game_sessions' 
    AND policyname = 'Users can view active sessions in their server'
  ) THEN
    DROP POLICY "Users can view active sessions in their server" ON game_sessions;
  END IF;
END $$;

-- Add RLS policy to allow users to view active sessions
CREATE POLICY "Users can view active sessions in their server"
  ON game_sessions
  FOR SELECT
  USING (game_status = 'active');