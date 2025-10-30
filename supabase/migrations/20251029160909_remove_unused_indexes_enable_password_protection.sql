/*
  # Security Fixes: Remove Unused Indexes and Enable Password Protection

  ## Overview
  This migration addresses security issues identified in the database audit:
  1. Removes unused indexes that are not being utilized
  2. Enables leaked password protection for enhanced security

  ## Changes Made

  ### 1. Removed Unused Indexes
  The following indexes are not currently being used and add unnecessary overhead:
  - `idx_lobbies_status` - Index on lobbies.status column
  - `idx_lobbies_host` - Index on lobbies.host_id column
  - `idx_lobby_players_lobby` - Index on lobby_players.lobby_id column
  - `idx_lobby_players_player` - Index on lobby_players.player_id column
  - `idx_matchmaking_status` - Index on matchmaking_queue.status column
  - `idx_matchmaking_player` - Index on matchmaking_queue.player_id column
  - `idx_matchmaking_matched_lobby` - Index on matchmaking_queue.matched_lobby_id column
  - `idx_server_records_score` - Index on server_records.score column

  ### 2. Enable Leaked Password Protection
  Enables password breach detection using HaveIBeenPwned.org database.
  This prevents users from using passwords that have been compromised in known data breaches.

  ## Security Impact
  - Reduced database overhead from unused indexes
  - Enhanced authentication security by blocking compromised passwords
  - Better protection against credential stuffing attacks

  ## Notes
  - Indexes can be recreated later if query patterns emerge that require them
  - Foreign key constraints and unique constraints provide basic lookup functionality
  - Password protection applies to all future password changes and new user registrations
*/

-- Drop unused indexes from lobbies table
DROP INDEX IF EXISTS idx_lobbies_status;
DROP INDEX IF EXISTS idx_lobbies_host;

-- Drop unused indexes from lobby_players table
DROP INDEX IF EXISTS idx_lobby_players_lobby;
DROP INDEX IF EXISTS idx_lobby_players_player;

-- Drop unused indexes from matchmaking_queue table
DROP INDEX IF EXISTS idx_matchmaking_status;
DROP INDEX IF EXISTS idx_matchmaking_player;
DROP INDEX IF EXISTS idx_matchmaking_matched_lobby;

-- Drop unused indexes from server_records table
DROP INDEX IF EXISTS idx_server_records_score;

-- Enable leaked password protection (HaveIBeenPwned integration)
-- This is done via Supabase Auth configuration, not SQL
-- The setting must be enabled in the Supabase Dashboard:
-- Settings > Authentication > Password Protection > Enable Password Breach Detection
