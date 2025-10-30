# WordHex Supabase Migration Guide

## Overview

This guide explains the migration from a dual-database system (PostgreSQL + Supabase) to a unified Supabase-only architecture. This fixes critical issues with user registration and ensures consistent data handling across the application.

## What Changed

### Database Architecture
- **Before**: Mixed PostgreSQL (Neon) + Supabase with conflicting schemas
  - Users table had both INTEGER (Neon) and UUID (Supabase) primary keys
  - Frontend used Supabase, backend used PostgreSQL directly
  - Missing tables and foreign key mismatches

- **After**: Unified Supabase-only architecture
  - All tables use UUID primary keys
  - Both frontend and backend use Supabase client
  - Consistent schema across the entire application

### Files Removed
- `db/schema.sql` - Old PostgreSQL schema (replaced by Supabase migrations)
- `db/init.js` - PostgreSQL initialization script (no longer needed)
- `server/db.js` - Direct PostgreSQL connection (replaced by `server/supabase.js`)

### Files Added/Modified
- `server/supabase.js` - NEW: Supabase client for server (uses service role key)
- `supabase/migrations/20251030000001_create_game_sessions_table.sql` - NEW: Game sessions table
- `supabase/migrations/20251030000002_create_server_records_table.sql` - NEW: Server records table
- `supabase/migrations/20251030000003_fix_rls_policies.sql` - NEW: Fixed security policies
- `server/index.js` - MODIFIED: Now uses Supabase instead of PostgreSQL
- `src/contexts/AuthContext.tsx` - MODIFIED: Creates player_stats on signup
- `.env.example` - NEW: Environment variable template

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned
3. Note down your project URL and API keys

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Server Configuration
PORT=3001

# Discord Configuration (if applicable)
DISCORD_BOT_TOKEN=your-bot-token
DISCORD_CLIENT_ID=your-client-id
DISCORD_CLIENT_SECRET=your-client-secret
```

**Where to find your Supabase keys:**
- Go to your Supabase project dashboard
- Click on "Settings" (gear icon) > "API"
- Copy the "Project URL" (VITE_SUPABASE_URL)
- Copy the "anon public" key (VITE_SUPABASE_ANON_KEY)
- Copy the "service_role" key (SUPABASE_SERVICE_ROLE_KEY) - **Keep this secret!**

### 3. Run Database Migrations

#### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-id

# Run migrations
supabase db push
```

#### Option B: Manual Migration via Dashboard

1. Go to your Supabase project dashboard
2. Click on "SQL Editor"
3. Run each migration file in order:
   - `20251029134657_add_users_table.sql`
   - `20251029141721_create_users_table.sql`
   - `20251029141750_create_game_tables.sql`
   - `20251029142150_fix_security_issues.sql`
   - `20251029160757_create_error_logs_table.sql`
   - `20251029160909_remove_unused_indexes_enable_password_protection.sql`
   - `20251029162152_create_users_table_with_rls.sql`
   - `20251029214301_add_unique_username_constraint.sql`
   - `20251029214717_add_password_to_users.sql`
   - **NEW** `20251030000001_create_game_sessions_table.sql`
   - **NEW** `20251030000002_create_server_records_table.sql`
   - **NEW** `20251030000003_fix_rls_policies.sql`

### 4. Install Dependencies

```bash
npm install
```

The `@supabase/supabase-js` package is already in `package.json`, so it will be installed automatically.

### 5. Start the Application

```bash
# Start the development server (frontend)
npm run dev

# In another terminal, start the backend server
npm run server
```

## Database Schema

### Tables Overview

#### `users`
- Primary key: `id` (UUID)
- Stores user accounts with authentication
- Fields: username, discord_id, password_hash, coins, gems, cosmetics, avatar_url

#### `player_stats`
- Primary key: `user_id` (UUID, FK to users)
- Aggregate statistics for each player
- Fields: total_matches, total_wins, total_score, best_score, win_streak, etc.

#### `game_sessions`
- Primary key: `id` (UUID)
- Foreign key: `user_id` (UUID, FK to users)
- Stores individual game session history
- Fields: score, words_found, gems_collected, duration, grid_data, server_id, status

#### `server_records`
- Primary key: `id` (UUID)
- Foreign key: `user_id` (UUID, FK to users)
- Stores best score per Discord server
- Unique constraint on `server_id`

#### `matches` (for multiplayer)
- Primary key: `id` (UUID)
- Stores multiplayer match data
- Fields: lobby_id, grid_data, status, started_at, ended_at

#### `match_players`
- Primary key: `id` (UUID)
- Foreign keys: `match_id` (FK to matches), `user_id` (FK to users)
- Links players to matches with their scores

## Security Notes

### Row Level Security (RLS)

All tables have RLS enabled with the following policies:

- **Users**: Public read, restricted updates (can't change coins/gems from frontend)
- **Player Stats**: Public read, server can update
- **Game Sessions**: Public read for completed sessions, restricted updates
- **Server Records**: Public read, anyone can submit records (checked for validity)

### Service Role Key

The backend server uses the **service role key** which bypasses RLS policies. This allows the server to:
- Update sensitive data like coins and gems
- Create and modify statistics
- Perform administrative operations

**⚠️ NEVER expose the service role key to the frontend or commit it to version control!**

## Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution**: Ensure your `.env` file contains all required variables and restart the server.

### Issue: "Failed to create player_stats"

**Solution**:
1. Check that the `player_stats` table exists in your Supabase database
2. Verify RLS policies allow inserts
3. Check server logs for detailed error messages

### Issue: "Foreign key constraint violation"

**Solution**:
1. Ensure all migrations have been run in order
2. Verify that user IDs are UUIDs, not integers
3. Check that referenced users exist before creating related records

### Issue: "Username already taken" on registration

**Solution**: This is expected behavior. Each username must be unique. The case-insensitive unique index ensures no duplicate usernames.

### Issue: Old data in PostgreSQL/Neon database

**Solution**:
- The old database is no longer used
- If you need to migrate existing user data, you'll need to write a custom migration script
- For a fresh start, just use the new Supabase database

## API Endpoints

All endpoints now use UUID user IDs:

- `POST /api/auth/login` - Login with username (Discord ID)
- `POST /api/auth/guest` - Create guest account
- `POST /api/game/sessions` - Save game session (userId should be UUID)
- `GET /api/game/sessions?userId=<UUID>` - Get user's game history
- `GET /api/game/leaderboard` - Get top 100 players
- `GET /api/game/server-records?serverId=<server_id>` - Get server record
- `POST /api/game/server-records` - Update server record (if higher score)

## Development Workflow

1. Make schema changes by creating new migration files in `supabase/migrations/`
2. Test migrations locally with `supabase db reset` (resets and applies all migrations)
3. Push migrations to production with `supabase db push`
4. Deploy frontend and backend code updates

## Production Deployment

### Frontend (Vite App)
- Deploy to Netlify, Vercel, or similar
- Set environment variables in the platform's dashboard
- Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set

### Backend (Node.js Server)
- Deploy to Vercel (as serverless functions), Render, Heroku, or similar
- Set all environment variables including `SUPABASE_SERVICE_ROLE_KEY`
- Ensure the server can make HTTPS requests to Supabase
- For Vercel deployment, use the `/api` directory for serverless functions

## Next Steps

1. ✅ Test user registration flow
2. ✅ Test game session creation
3. ✅ Verify leaderboard displays correctly
4. Test multiplayer matches (if applicable)
5. Set up monitoring and error logging
6. Configure backup strategies in Supabase

## Support

For issues or questions:
- Check Supabase logs: Dashboard > Logs
- Check server logs: `npm run server`
- Review browser console for frontend errors
- Consult [Supabase documentation](https://supabase.com/docs)
