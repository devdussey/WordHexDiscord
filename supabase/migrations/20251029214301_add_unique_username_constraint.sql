/*
  # Add Unique Username Constraint
  
  1. Changes
    - Add unique constraint to `username` column in `users` table
    - This ensures no two users can have the same username
    - Case-insensitive uniqueness check
  
  2. Notes
    - Username must be unique across all users
    - Prevents duplicate usernames during registration
*/

-- Add unique constraint to username (case-insensitive)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_username_unique'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);
  END IF;
END $$;

-- Create a case-insensitive unique index on username
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower 
  ON users (LOWER(username));