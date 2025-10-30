# WordHex API - Vercel Serverless Functions

This directory contains the serverless API functions for the WordHex application, deployed on Vercel.

## Structure

```
api/
├── _supabase.js          # Shared Supabase client and CORS utilities
├── auth/
│   ├── login.js          # POST /api/auth/login - User login
│   └── guest.js          # POST /api/auth/guest - Guest account creation
└── game/
    ├── sessions.js       # POST/GET /api/game/sessions - Game session management
    ├── leaderboard.js    # GET /api/game/leaderboard - Fetch leaderboard
    └── server-records.js # GET/POST /api/game/server-records - Server record management
```

## API Endpoints

### Authentication

#### POST `/api/auth/login`
Login with Discord username or create new account.

**Request Body:**
```json
{
  "username": "string"
}
```

**Response:**
```json
{
  "token": "user_<uuid>",
  "user": {
    "id": "uuid",
    "username": "string",
    "discord_id": "string",
    "coins": 100,
    "gems": 10
  }
}
```

#### POST `/api/auth/guest`
Create a guest account.

**Response:**
```json
{
  "token": "user_<uuid>",
  "user": {
    "id": "uuid",
    "username": "Guest_<timestamp>",
    "discord_id": "guest_<timestamp>_<random>",
    "coins": 50,
    "gems": 5
  }
}
```

### Game

#### POST `/api/game/sessions`
Create a new game session.

**Request Body:**
```json
{
  "userId": "uuid",
  "score": 0,
  "wordsFound": 0,
  "gemsCollected": 0,
  "duration": 0,
  "gridData": {},
  "serverId": "string",
  "channelId": "string"
}
```

#### GET `/api/game/sessions?userId=<uuid>`
Get user's game sessions.

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "score": 0,
    "words_found": 0,
    "gems_collected": 0,
    "duration": 0,
    "created_at": "timestamp"
  }
]
```

#### GET `/api/game/leaderboard`
Get top 100 players by best score.

**Response:**
```json
[
  {
    "username": "string",
    "user_id": "uuid",
    "total_matches": 0,
    "total_score": 0,
    "best_score": 0,
    "total_words": 0
  }
]
```

#### GET `/api/game/server-records?serverId=<string>`
Get server record.

#### POST `/api/game/server-records`
Create or update server record.

**Request Body:**
```json
{
  "serverId": "string",
  "userId": "uuid",
  "username": "string",
  "score": 0,
  "wordsFound": 0,
  "gemsCollected": 0
}
```

## Environment Variables

Required environment variables (set in Vercel dashboard):

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (bypasses RLS)

## Important Notes

### WebSockets Not Supported
Vercel serverless functions **do not support traditional WebSockets**. The original Express.js backend included WebSocket support at `/ws`, but this is not available in serverless functions.

**Alternatives for real-time features:**
1. **Supabase Realtime** (Recommended) - Use Supabase's built-in realtime subscriptions
2. **Polling** - Use periodic API calls to check for updates
3. **Vercel Edge Functions** - Limited WebSocket support via Vercel's edge runtime

### CORS
All endpoints include CORS headers to allow cross-origin requests. This is configured in `_supabase.js`.

### Cold Starts
Serverless functions may experience cold starts (1-2 second delay on first request). This is normal for serverless architectures.

## Local Development

To test the API functions locally:

```bash
# Install Vercel CLI
npm install -g vercel

# Run locally
vercel dev
```

This will start a local server that simulates the Vercel environment.

## Deployment

API functions are automatically deployed with your Vercel project. No separate deployment needed.

Vercel automatically:
- Detects files in `/api` directory
- Installs dependencies from `api/package.json`
- Creates serverless function endpoints

## Migration from Express.js

The original Express.js backend (`server/index.js`) has been converted to these serverless functions. Key differences:

- ✅ All HTTP endpoints converted
- ❌ WebSocket support removed (use Supabase Realtime instead)
- ✅ CORS handled per-request
- ✅ Supabase client initialized per-request
- ✅ Same database operations and logic
