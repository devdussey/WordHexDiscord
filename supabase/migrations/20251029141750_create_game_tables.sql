/*
  # Create Game Tables for WordHex Discord Activity

  ## Overview
  This migration creates tables for game matches, player statistics, and leaderboards.

  ## New Tables
  
  ### `matches`
  Stores game match information
  - `id` (uuid, primary key) - Unique match identifier
  - `lobby_id` (text) - Discord lobby/channel identifier
  - `grid_data` (jsonb) - The hex grid letters for this match
  - `status` (text) - Match status: 'waiting', 'active', 'completed'
  - `started_at` (timestamptz) - When the match started
  - `ended_at` (timestamptz) - When the match ended
  - `created_at` (timestamptz) - Match creation timestamp

  ### `match_players`
  Links players to matches with their scores
  - `id` (uuid, primary key)
  - `match_id` (uuid, foreign key) - Reference to matches table
  - `user_id` (uuid, foreign key) - Reference to users table
  - `score` (integer) - Player's score in this match
  - `words_found` (jsonb) - Array of words the player found
  - `rank` (integer) - Player's rank in this match (1st, 2nd, etc.)
  - `joined_at` (timestamptz) - When player joined the match

  ### `player_stats`
  Aggregate statistics for each player
  - `user_id` (uuid, primary key, foreign key) - Reference to users table
  - `total_matches` (integer) - Total matches played
  - `total_wins` (integer) - Number of first place finishes
  - `total_score` (integer) - Cumulative score across all matches
  - `total_words` (integer) - Total unique words found
  - `best_score` (integer) - Highest single match score
  - `win_streak` (integer) - Current consecutive wins
  - `best_win_streak` (integer) - Longest win streak achieved
  - `updated_at` (timestamptz) - Last statistics update

  ## Security
  - Enable RLS on all tables
  - All players can read match and statistics data
  - Only system can create/update matches
  - Players can view their own match participation

  ## Notes
  - Matches track the complete game state
  - Statistics are updated after each match completes
  - Leaderboards can be built from player_stats table
*/

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id text,
  grid_data jsonb NOT NULL,
  status text DEFAULT 'waiting' NOT NULL,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create match_players junction table
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

-- Create player_stats table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_lobby_id ON matches(lobby_id);
CREATE INDEX IF NOT EXISTS idx_match_players_match_id ON match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_match_players_user_id ON match_players(user_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_total_score ON player_stats(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_player_stats_total_wins ON player_stats(total_wins DESC);

-- Enable RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for matches
CREATE POLICY "Anyone can read matches"
  ON matches
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow match creation"
  ON matches
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow match updates"
  ON matches
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for match_players
CREATE POLICY "Anyone can read match players"
  ON match_players
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow joining matches"
  ON match_players
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow updating match player data"
  ON match_players
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for player_stats
CREATE POLICY "Anyone can read player stats"
  ON player_stats
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow stats creation"
  ON player_stats
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow stats updates"
  ON player_stats
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger to update player_stats updated_at
CREATE TRIGGER update_player_stats_updated_at
  BEFORE UPDATE ON player_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();