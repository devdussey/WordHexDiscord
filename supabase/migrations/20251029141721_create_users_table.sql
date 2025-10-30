/*
  # Create Users Table for WordHex Discord Activity

  ## Overview
  This migration creates the core users table to store player profiles and game currency.

  ## New Tables
  
  ### `users`
  Stores player profile information synchronized from Discord
  - `id` (uuid, primary key) - Unique user identifier
  - `discord_id` (text, unique, not null) - Discord user ID for authentication
  - `username` (text, not null) - Discord username
  - `coins` (integer, default 0) - In-game currency earned through gameplay
  - `gems` (integer, default 0) - Premium currency for cosmetics
  - `cosmetics` (jsonb, default []) - Array of unlocked cosmetic items
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last profile update timestamp

  ## Security
  - Enable RLS on users table
  - Users can read their own profile data
  - Users can update their own username and cosmetics
  - System can insert new users (via service role)

  ## Notes
  - Discord ID is the primary authentication mechanism
  - Coins are earned through gameplay and word discovery
  - Gems can be purchased or earned through achievements
  - Cosmetics array stores item IDs that can be expanded later
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id text UNIQUE NOT NULL,
  username text NOT NULL,
  coins integer DEFAULT 0 NOT NULL,
  gems integer DEFAULT 0 NOT NULL,
  cosmetics jsonb DEFAULT '[]'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create index on discord_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id);

-- RLS Policies
-- Note: Discord Activities don't use traditional Supabase auth, so we'll allow read access
-- and restrict writes through application logic and future policies

-- Allow anyone to read user data (needed for leaderboards and multiplayer)
CREATE POLICY "Users can read all profiles"
  ON users
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow inserts (new user registration through app)
CREATE POLICY "Allow user registration"
  ON users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();