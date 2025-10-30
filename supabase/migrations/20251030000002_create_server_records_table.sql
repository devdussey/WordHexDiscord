/*
  # Create Server Records Table

  ## Overview
  This migration creates the server_records table for tracking the best
  scores achieved on each Discord server.

  ## New Table: server_records
  Stores the highest score per Discord server:
  - `id` (uuid, primary key) - Unique record identifier
  - `server_id` (text, unique) - Discord server/guild ID
  - `user_id` (uuid, foreign key) - Reference to users table (nullable)
  - `username` (text) - Username of the record holder
  - `score` (integer) - The record score
  - `words_found` (integer) - Number of words found in record game
  - `gems_collected` (integer) - Number of gems collected in record game
  - `achieved_at` (timestamptz) - When the record was set
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on server_records table
  - Anyone can view server records (for leaderboards)
  - Anyone can insert new records (system will handle conflicts)
  - Updates only allowed if new score is higher (handled in upsert logic)

  ## Indexes
  - Index on server_id for fast lookups
  - Index on score for ranking
*/

-- Create server_records table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_server_records_server_id
  ON server_records(server_id);

CREATE INDEX IF NOT EXISTS idx_server_records_score
  ON server_records(score DESC);

-- Enable RLS
ALTER TABLE server_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for server_records

-- Allow anyone to view server records
CREATE POLICY "Anyone can view server records"
  ON server_records
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anyone to insert new server records
CREATE POLICY "Anyone can insert server records"
  ON server_records
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow updates to server records (for record breaking)
CREATE POLICY "Anyone can update server records"
  ON server_records
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_server_records_updated_at
  BEFORE UPDATE ON server_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
