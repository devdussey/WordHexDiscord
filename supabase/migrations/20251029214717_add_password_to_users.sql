/*
  # Add Password Authentication to Users Table
  
  1. Changes
    - Add `password_hash` column to store hashed passwords
    - Users will authenticate directly without Supabase Auth
    - Simpler auth flow for Discord Activity
  
  2. Security
    - Passwords are hashed before storage (handled in app)
    - Username is unique and case-insensitive
  
  3. Notes
    - This bypasses Supabase Auth email confirmation
    - Better for embedded Discord Activity apps
*/

-- Add password_hash column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users ADD COLUMN password_hash text;
  END IF;
END $$;

-- Make id column use auth.uid() by default for compatibility
-- But allow manual insertion for custom auth
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();