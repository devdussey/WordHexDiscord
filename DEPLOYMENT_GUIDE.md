# Discord Activity Deployment Guide

## Quick Start: Making Your Activity Public

Your Discord Activity needs to be hosted publicly for users to access it. Here's how to deploy it:

---

## Option 1: Cloudflare Pages (Recommended)

### Step 1: Deploy to Cloudflare Pages

1. **Create Cloudflare Account**
   - Go to [cloudflare.com](https://cloudflare.com)
   - Sign up for a free account

2. **Connect GitHub Repository**
   - Go to **Pages** in Cloudflare Dashboard
   - Click **"Create a project"**
   - Connect your GitHub account
   - Select your repository

3. **Configure Build Settings**
   ```
   Build command: npm run build
   Build output directory: dist
   Root directory: /
   ```

4. **Add Environment Variables**
   - `VITE_SUPABASE_URL`: https://sbnhrfnmediitmkmzhfa.supabase.co
   - `VITE_SUPABASE_ANON_KEY`: your-anon-key
   - `VITE_DISCORD_CLIENT_ID`: 1433031616262832239

5. **Deploy**
   - Click **"Save and Deploy"**
   - Wait for build to complete (~2-3 minutes)
   - Copy your deployment URL: `https://wordhex.pages.dev`

---

## Option 2: Netlify

### Step 1: Deploy to Netlify

1. **Create Netlify Account**
   - Go to [netlify.com](https://netlify.com)
   - Sign up for free

2. **New Site from Git**
   - Click **"Add new site"** → **"Import an existing project"**
   - Connect GitHub
   - Select your repository

3. **Configure Build**
   ```
   Build command: npm run build
   Build output directory: dist
   Branch to deploy: main
   ```

4. **Add Environment Variables**
   - Go to **Site settings** → **Environment variables**
   - Add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_DISCORD_CLIENT_ID`

5. **Deploy**
   - Click **"Deploy site"**
   - Copy your URL: `https://wordhex.netlify.app`

---

## Option 3: Vercel

### Step 1: Deploy to Vercel

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import Project**
   - Click **"Add New"** → **"Project"**
   - Select your repository

3. **Configure Project**
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Add Environment Variables**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_DISCORD_CLIENT_ID`

5. **Deploy**
   - Click **"Deploy"**
   - Copy your URL: `https://wordhex.vercel.app`

---

## Step 2: Configure Discord Developer Portal

Once deployed, configure your Discord Application:

### 1. Go to Discord Developer Portal

Visit: https://discord.com/developers/applications/1433031616262832239

### 2. Configure Activities

1. Click **"Activities"** in left sidebar
2. Under **"Activity Details"**:
   - **Activity Name**: WordHex
   - **Description**: Connect letters, create words, dominate the hexagon!
   - **Tags**: word game, puzzle, casual

3. Under **"URL Mappings"**:
   - Click **"Add URL Mapping"**
   - **Prefix**: `/`
   - **Target**: `https://your-deployed-url.com` (your Cloudflare/Netlify/Vercel URL)
   - Click **"Save"**

### 3. Configure OAuth2

1. Click **"OAuth2"** in left sidebar
2. Under **"Redirects"**:
   - Add: `https://your-deployed-url.com`
   - Add: `https://your-deployed-url.com/`
3. Click **"Save Changes"**

### 4. Set Application Icon (Optional)

1. Go to **"General Information"**
2. Upload your app icon (use `/public/Dorion_zIkK0aVc6b.png`)
3. Click **"Save Changes"**

---

## Step 3: Enable Activity in Discord

### Add Activity to Your Server

1. **Open Discord**
2. **Go to any server** where you have admin/manage channels permissions
3. **Open a text channel**
4. **Click the rocket icon (🚀)** near the message input
5. **Find "WordHex"** in the activities list
6. **Click it to launch**

### Share with Others

Once configured, users can:
1. Join your Discord server
2. Click the rocket icon (🚀) in any channel
3. Launch WordHex to play

---

## Step 4: Test Your Activity

### Testing Checklist

- [ ] Activity appears in Discord's rocket menu
- [ ] Activity launches in iframe
- [ ] Authentication works (Discord SDK connects)
- [ ] Game loads correctly
- [ ] Server ID is captured correctly
- [ ] Active sessions show up
- [ ] Multiplayer features work
- [ ] Leaderboard updates
- [ ] Game saves to database

---

## Troubleshooting

### Activity Not Appearing in Discord

**Issue:** Can't find activity in rocket menu

**Solutions:**
1. Verify URL Mappings are correct in Developer Portal
2. Check that your deployment is live (visit URL in browser)
3. Ensure OAuth2 redirects include your deployment URL
4. Wait 5-10 minutes for Discord to propagate changes
5. Restart Discord client

### CORS Errors

**Issue:** Console shows CORS policy errors

**Solutions:**
1. Verify your deployment includes correct headers:
   - `Cross-Origin-Opener-Policy: same-origin-allow-popups`
   - `Cross-Origin-Embedder-Policy: credentialless`
2. Check that `_headers` file is in `/public` directory
3. For Netlify, verify `netlify.toml` is in root
4. Redeploy after adding header files

### Authentication Fails

**Issue:** "Authenticating..." screen stuck

**Solutions:**
1. Check environment variables are set:
   - `VITE_DISCORD_CLIENT_ID` must match your app ID
   - Must include `VITE_` prefix for Vite
2. Verify OAuth2 redirect URLs in Developer Portal
3. Check browser console for Discord SDK errors
4. Ensure your app has proper scopes: `identify`, `guilds`

### Activity Shows Blank Screen

**Issue:** Activity launches but shows nothing

**Solutions:**
1. Check browser console for JavaScript errors
2. Verify build completed successfully
3. Test URL directly in browser (outside Discord)
4. Check that all assets are loading (CSS, JS)
5. Verify Content Security Policy headers allow Discord iframe

### Server ID Not Working

**Issue:** Can't see other players' sessions

**Solutions:**
1. Verify Discord SDK is getting guild/server information
2. Check that server_id is being saved to database
3. Test in development mode first
4. Ensure RLS policies allow viewing active sessions
5. Check Supabase connection is working

---

## Environment Variables

### Required Variables

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://sbnhrfnmediitmkmzhfa.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Discord Configuration
VITE_DISCORD_CLIENT_ID=1433031616262832239
```

### Setting in Deployment Platforms

**Cloudflare Pages:**
- Settings → Environment variables → Add variable

**Netlify:**
- Site settings → Environment variables → Add a variable

**Vercel:**
- Project Settings → Environment Variables → Add

**Important:** Always use `VITE_` prefix for variables accessed in frontend!

---

## Production Checklist

Before going live:

- [ ] App deployed to public URL
- [ ] Environment variables configured
- [ ] Discord Developer Portal configured
- [ ] URL Mappings set correctly
- [ ] OAuth2 redirects added
- [ ] Headers configured (CORS, CSP, COOP, COEP)
- [ ] Tested in Discord client
- [ ] Database connected and working
- [ ] Active sessions feature tested
- [ ] Leaderboards working
- [ ] Multiple users tested simultaneously

---

## Next Steps

1. **Deploy Now**
   - Choose a platform (Cloudflare/Netlify/Vercel)
   - Connect your GitHub repo
   - Add environment variables
   - Deploy

2. **Configure Discord**
   - Add URL mapping
   - Set OAuth2 redirects
   - Save changes

3. **Test**
   - Launch in Discord
   - Verify all features work
   - Test with friends

4. **Share**
   - Invite users to your server
   - Show them how to launch
   - Enjoy WordHex!

---

## Support

If you encounter issues:

1. Check browser console for errors
2. Verify all environment variables are set
3. Test deployment URL directly in browser
4. Check Discord Developer Portal configuration
5. Review Supabase logs for database errors

For Discord Activity-specific issues:
- [Discord Activities Documentation](https://discord.com/developers/docs/activities/overview)
- [Discord Developer Support](https://discord.gg/discord-developers)

---

## Current Configuration

**Discord Application ID:** 1433031616262832239
**Supabase URL:** https://sbnhrfnmediitmkmzhfa.supabase.co
**Status:** Ready to Deploy

**Deployment Status:** ⏳ Pending
**Discord Configuration:** ⏳ Pending

Once deployed, your Activity URL will be: `https://your-deployment-url.com`
