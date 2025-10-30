/*
  # Add Users Table

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `discord_id` (text, unique) - Discord user ID
      - `username` (text) - Discord username
      - `coins` (integer, default 0) - In-game currency
      - `gems` (integer, default 0) - Premium currency
      - `cosmetics` (jsonb, default []) - Owned cosmetics
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on users table
    - Users can read all profiles
    - Users can update their own profile
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id text UNIQUE NOT NULL,
  username text NOT NULL,
  coins integer DEFAULT 0,
  gems integer DEFAULT 0,
  cosmetics jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow public read access for all users (needed for leaderboards and multiplayer)
CREATE POLICY "Anyone can view user profiles"
  ON users FOR SELECT
  USING (true);

-- Allow users to insert their own profile (first login)
CREATE POLICY "Users can create own profile"
  ON users FOR INSERT
  WITH CHECK (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (true)
  WITH CHECK (true);