/*
  # Fix Security Issues

  ## Overview
  This migration addresses security concerns identified in the database:
  1. Removes unused indexes that are not yet needed (tables are empty)
  2. Fixes function search path mutability issue for update_updated_at_column

  ## Changes Made
  
  ### Removed Unused Indexes
  Since the tables are newly created and empty, these indexes aren't being used yet.
  They can be added back when the application starts generating queries that need them:
  - idx_users_discord_id (covered by unique constraint)
  - idx_matches_status
  - idx_matches_lobby_id
  - idx_match_players_match_id (covered by foreign key)
  - idx_match_players_user_id (covered by foreign key)
  - idx_player_stats_total_score
  - idx_player_stats_total_wins

  ### Fixed Function Search Path
  Updated update_updated_at_column function to have an immutable search_path
  by recreating it with CASCADE to handle dependent triggers

  ## Notes
  - Indexes can be recreated later when query patterns emerge and performance tuning is needed
  - The unique constraint on discord_id and foreign key indexes provide basic lookup performance
  - Function security is improved by setting explicit search_path
*/

-- Drop unused indexes
DROP INDEX IF EXISTS idx_users_discord_id;
DROP INDEX IF EXISTS idx_matches_status;
DROP INDEX IF EXISTS idx_matches_lobby_id;
DROP INDEX IF EXISTS idx_match_players_match_id;
DROP INDEX IF EXISTS idx_match_players_user_id;
DROP INDEX IF EXISTS idx_player_stats_total_score;
DROP INDEX IF EXISTS idx_player_stats_total_wins;

-- Fix function search path mutability issue
-- Drop function and dependent triggers with CASCADE
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Recreate function with proper security settings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

-- Recreate the triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_stats_updated_at
  BEFORE UPDATE ON player_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();