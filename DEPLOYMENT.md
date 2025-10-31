# WordHex Discord Deployment Guide

This guide will help you deploy your WordHex Discord app with Vercel (frontend) and Railway (backend).

## ✅ Frontend Deployed (Vercel)

**Status:** Deployed
**Production URL:** https://wordhex-discord-dgc9ym7ku-devdusseys-projects.vercel.app
**Dashboard:** https://vercel.com/devdusseys-projects/wordhex-discord

### Frontend Environment Variables (Vercel)

After Railway deployment, add these environment variables in your Vercel dashboard:

```bash
VITE_DISCORD_CLIENT_ID=1433031616262832239
VITE_API_URL=https://your-railway-url/api
VITE_WS_URL=wss://your-railway-url/ws
```

**To add them:**
1. Go to https://vercel.com/devdusseys-projects/wordhex-discord/settings/environment-variables
2. Add each variable
3. Redeploy: `vercel --prod`

---

## 🚂 Backend Deployment (Railway)

### Step 1: Login to Railway

```bash
cd WordHexDiscord
railway login
```

This will open your browser for authentication.

### Step 2: Initialize Railway Project

```bash
railway init
```

Select "Create new project" and give it a name like `wordhex-backend`.

### Step 3: Link to GitHub (Optional but Recommended)

```bash
railway link
```

Or link it manually in the Railway dashboard.

### Step 4: Set Environment Variables

```bash
# Required by Railway (auto-set)
railway variables set PORT=3001

# Optional Discord Bot Configuration
railway variables set DISCORD_BOT_TOKEN=your-bot-token
railway variables set DISCORD_CLIENT_ID=your-client-id
railway variables set DISCORD_CLIENT_SECRET=your-client-secret
```

Or set them in the Railway dashboard: https://railway.app/dashboard

### Step 5: Deploy to Railway

```bash
railway up
```

### Step 6: Get Your Railway URL

```bash
railway domain
```

Or create one in the Railway dashboard. Your backend URL will look like:
`https://wordhex-backend-production.up.railway.app`

---

## 🔗 Connect Frontend to Backend

### Update Vercel Environment Variables

Once you have your Railway URL, update Vercel:

```bash
# Using Vercel CLI
vercel env add VITE_API_URL production
# Enter: https://your-railway-url/api

vercel env add VITE_WS_URL production
# Enter: wss://your-railway-url/ws

# Redeploy
vercel --prod
```

Or add them in the Vercel dashboard:
- Go to Settings → Environment Variables
- Add `VITE_API_URL` = `https://your-railway-url/api`
- Add `VITE_WS_URL` = `wss://your-railway-url/ws`

---

## 📝 Configuration Files Created

- `railway.json` - Railway deployment configuration
- `Procfile` - Process definition for Railway
- Both files configure the server to run with `node server/index.js`

---

## 🧪 Testing Your Deployment

1. **Test Backend Health:**
   ```bash
   curl https://your-railway-url/api/matchmaking/snapshot
   ```

2. **Test Frontend:**
   - Visit your Vercel URL
   - Check browser console for API connection errors
   - Verify WebSocket connection

3. **Test Full Flow:**
   - Create a lobby
   - Join a game
   - Check if realtime updates work

---

## 🔄 Future Deployments

### Frontend (Vercel)
```bash
git push  # Auto-deploys if GitHub connected
# or
vercel --prod
```

### Backend (Railway)
```bash
git push  # Auto-deploys if GitHub connected
# or
railway up
```

---

## 🐛 Troubleshooting

### Backend not starting?
- Check Railway logs: `railway logs`
- Verify PORT environment variable is set
- Check that `node_modules` dependencies are installed

### Frontend can't connect to backend?
- Verify CORS is enabled in `server/index.js` (already configured)
- Check environment variables in Vercel
- Ensure Railway URL uses HTTPS (not HTTP)
- For WebSocket, ensure you're using WSS (not WS)

### Railway domain issues?
- Generate a domain: `railway domain`
- Or add a custom domain in Railway dashboard

---

## 📚 Useful Commands

```bash
# Vercel
vercel --prod              # Deploy to production
vercel logs                # View deployment logs
vercel env ls              # List environment variables
vercel inspect <url>       # Inspect a deployment

# Railway
railway up                 # Deploy
railway logs               # View logs
railway status             # Check deployment status
railway variables          # Manage environment variables
railway domain             # Manage domains
railway run node server/index.js  # Run locally with Railway env
```
