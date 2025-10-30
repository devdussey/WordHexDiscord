# Fix Deployment Error

## ❌ Current Error

```
Executing user deploy command: dist
/bin/sh: 1: dist: not found
Failed: error occurred while running deploy command
```

## ✅ The Fix

The deployment is trying to run `dist` as a command. Instead, you need to:

### Quick Solution - Use Cloudflare Pages CLI

```bash
# 1. Install Wrangler
npm install -g wrangler

# 2. Login to Cloudflare
wrangler login

# 3. Build your app
npm run build

# 4. Deploy
wrangler pages deploy dist --project-name=wordhex
```

**Your URL will be:** `https://wordhex.pages.dev`

---

### Alternative - Use Netlify CLI

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Build and Deploy
npm run build
netlify deploy --prod --dir=dist
```

---

### Alternative - Use Web Dashboard

#### Cloudflare Pages:
1. Go to https://dash.cloudflare.com
2. Pages → Create project → Connect to Git
3. Build command: `npm run build`
4. Build output: `dist`
5. Add environment variables:
   ```
   VITE_SUPABASE_URL=https://sbnhrfnmediitmkmzhfa.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-key>
   VITE_DISCORD_CLIENT_ID=1433031616262832239
   ```
6. Deploy

#### Netlify:
1. Go to https://app.netlify.com
2. New site from Git → Connect repository
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables (same as above)
6. Deploy

---

## After Deployment

1. **Copy your deployment URL**
2. **Configure Discord:**
   - https://discord.com/developers/applications/1433031616262832239
   - Activities → URL Mappings → Add: `/` → `https://your-url.com`
   - OAuth2 → Redirects → Add: `https://your-url.com`
3. **Test in Discord!**

---

## Why This Happened

The error occurs when the deployment platform is configured with `dist` as a deploy command instead of as the output directory. The correct setup is:

- **Build command:** `npm run build` (this creates the dist folder)
- **Output directory:** `dist` (this tells the platform where to find built files)
- **Deploy command:** Not needed (platform handles this automatically)

---

## Need More Help?

See full guides:
- [`QUICK_DEPLOY.md`](./QUICK_DEPLOY.md)
- [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md)
- [`DISCORD_ACTIVITY_SETUP.md`](./DISCORD_ACTIVITY_SETUP.md)
