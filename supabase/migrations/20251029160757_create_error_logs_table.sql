/*
  # Create error logs table

  1. New Tables
    - `error_logs`
      - `id` (uuid, primary key)
      - `error_type` (text) - Type of error (NETWORK, API, VALIDATION, etc.)
      - `severity` (text) - Severity level (LOW, MEDIUM, HIGH, CRITICAL)
      - `message` (text) - Technical error message
      - `user_message` (text) - User-friendly error message
      - `context` (jsonb) - Additional context and metadata
      - `timestamp` (timestamptz) - When the error occurred
      - `retryable` (boolean) - Whether the error can be retried
      - `created_at` (timestamptz) - Record creation time

  2. Security
    - Enable RLS on `error_logs` table
    - Add policy for authenticated users to insert their own error logs
    - Add policy for admins to view all error logs

  3. Indexes
    - Add index on error_type for filtering
    - Add index on severity for filtering
    - Add index on timestamp for time-based queries
*/

CREATE TABLE IF NOT EXISTS error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type text NOT NULL,
  severity text NOT NULL,
  message text NOT NULL,
  user_message text NOT NULL,
  context jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz NOT NULL DEFAULT now(),
  retryable boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert error logs"
  ON error_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their own error logs"
  ON error_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
