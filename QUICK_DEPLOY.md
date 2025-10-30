# Quick Deploy to Discord Activity

## TL;DR - 5 Minute Setup

### 1. Deploy Your App (Choose One)

#### Option A: Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```
Your URL will be: `https://wordhex.vercel.app`

#### Option B: Cloudflare Pages
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
npm run build
wrangler pages deploy dist --project-name=wordhex
```
Your URL will be: `https://wordhex.pages.dev`

#### Option C: Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

#### Option D: GitHub + Auto Deploy
1. Push code to GitHub
2. Visit [Vercel](https://vercel.com), [Cloudflare Pages](https://pages.cloudflare.com), or [Netlify](https://netlify.com)
3. Click "New Project" → Connect GitHub
4. Select your repo
5. Add environment variables:
   ```
   VITE_SUPABASE_URL=https://sbnhrfnmediitmkmzhfa.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-key>
   VITE_DISCORD_CLIENT_ID=1433031616262832239
   ```
6. Deploy!

---

### 2. Configure Discord (2 minutes)

1. Go to: https://discord.com/developers/applications/1433031616262832239
2. Click **"Activities"** tab
3. Under **"URL Mappings"**, click **"Add URL Mapping"**:
   - Prefix: `/`
   - Target: `https://wordhex.vercel.app` (or your deployed URL)
4. Click **"OAuth2"** tab
5. Add redirect URL: `https://wordhex.vercel.app` (or your deployed URL)
6. Click **"Save Changes"**

---

### 3. Test in Discord (30 seconds)

1. Open Discord
2. Join any server
3. Click rocket icon 🚀 in chat
4. Find "WordHex"
5. Click to launch!

---

## That's It!

Your Discord Activity is now live and users can play WordHex!

---

## Troubleshooting

**Activity not showing in Discord?**
- Wait 5-10 minutes after saving changes
- Restart Discord
- Check URL mapping is correct

**Authentication fails?**
- Verify environment variables are set
- Check OAuth2 redirect URLs include your deployment URL

**Need help?**
- Read full guide: `DEPLOYMENT_GUIDE.md`
- Check Discord docs: https://discord.com/developers/docs/activities

---

## Environment Variables Required

```bash
VITE_SUPABASE_URL=https://sbnhrfnmediitmkmzhfa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNibmhyZm5tZWRpaXRta216aGZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODIxNTQsImV4cCI6MjA3NzI1ODE1NH0.CxWwZbiQzO4d3Vr5K-I7k2h54Bd6mRafpxy8oUe9Gm0
VITE_DISCORD_CLIENT_ID=1433031616262832239
```

Copy these to your deployment platform's environment variables section.
