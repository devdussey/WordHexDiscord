# Discord Activity Setup - Complete Checklist

## Current Status

✅ **Application Built:** Ready for deployment
✅ **Database:** Configured and migrated
✅ **Headers:** CORS/CSP configured for Discord
✅ **Features:** All implemented and tested
⏳ **Deployment:** Ready to deploy
⏳ **Discord Config:** Needs URL mapping

---

## What You Need to Do

### Step 1: Deploy Your App (5 minutes)

Choose ONE option:

#### Option A: Cloudflare Pages (Recommended)
```bash
npm install -g wrangler
wrangler login
npm run build
wrangler pages deploy dist --project-name=wordhex
```
✅ Your URL: `https://wordhex.pages.dev`

#### Option B: Netlify (Easiest)
1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Connect GitHub repo
4. Add environment variables (see below)
5. Deploy

#### Option C: Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import Git repository
3. Add environment variables (see below)
4. Deploy

**Environment Variables to Add:**
```
VITE_SUPABASE_URL=https://sbnhrfnmediitmkmzhfa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNibmhyZm5tZWRpaXRta216aGZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODIxNTQsImV4cCI6MjA3NzI1ODE1NH0.CxWwZbiQzO4d3Vr5K-I7k2h54Bd6mRafpxy8oUe9Gm0
VITE_DISCORD_CLIENT_ID=1433031616262832239
```

---

### Step 2: Configure Discord Developer Portal (3 minutes)

1. **Go to:** https://discord.com/developers/applications/1433031616262832239

2. **Click "Activities" Tab**
   - Under "Activity Details":
     - Name: `WordHex`
     - Description: `Connect letters, create words, dominate the hexagon!`
     - Tags: `word game, puzzle, multiplayer`

   - Under "URL Mappings":
     - Click "Add URL Mapping"
     - Prefix: `/`
     - Target: `https://your-deployed-url.com` (from Step 1)
     - Click "Save"

3. **Click "OAuth2" Tab**
   - Under "Redirects", add:
     - `https://your-deployed-url.com`
     - `https://your-deployed-url.com/`
   - Click "Save Changes"

4. **Optional: Add App Icon**
   - Go to "General Information"
   - Upload `/public/Dorion_zIkK0aVc6b.png`

---

### Step 3: Test in Discord (1 minute)

1. Open Discord
2. Join any server where you have permissions
3. Open a text channel
4. Click the **rocket icon 🚀** near the message box
5. Find **"WordHex"** in the list
6. Click to launch!

---

## Verification Checklist

After deployment, verify:

- [ ] App URL loads in browser (test outside Discord first)
- [ ] No console errors when loading
- [ ] Authentication works (shows username)
- [ ] Can start a game
- [ ] Words can be submitted
- [ ] Score updates
- [ ] Active sessions show up
- [ ] Database saves game data
- [ ] Leaderboard populates

---

## Your App Details

**Discord Application:**
- ID: `1433031616262832239`
- Name: WordHex

**Supabase:**
- URL: `https://sbnhrfnmediitmkmzhfa.supabase.co`
- Status: ✅ Connected

**Current Build:**
- Status: ✅ Ready
- Size: ~625 KB (gzipped)
- Location: `/dist`

**Features Ready:**
- ✅ 178,590 word dictionary
- ✅ Single-player mode
- ✅ Active sessions browser
- ✅ Real-time updates
- ✅ Leaderboards
- ✅ Server tracking
- ✅ Player avatars

---

## Common Issues & Solutions

### Issue: Activity doesn't appear in Discord rocket menu

**Solutions:**
1. Wait 5-10 minutes after saving Discord config
2. Restart Discord completely
3. Verify URL mapping is saved correctly
4. Check that deployment is live (visit URL in browser)

### Issue: "Authenticating..." stuck

**Solutions:**
1. Verify environment variables are set in deployment
2. Check OAuth2 redirect URLs include deployment URL
3. Ensure `VITE_` prefix is used for all frontend variables

### Issue: Blank screen or CORS errors

**Solutions:**
1. Check `_headers` file exists in `/dist` folder
2. Verify deployment platform is serving headers correctly
3. For Netlify: Check `netlify.toml` is in root
4. For Vercel: Check `vercel.json` is in root
5. For Cloudflare: Check `wrangler.toml` is in root

### Issue: Can't see other players' sessions

**Solutions:**
1. Ensure games are started AFTER deployment (old sessions won't have server_id)
2. Check database for `server_id` field in `game_sessions` table
3. Verify Supabase connection is working
4. Check browser console for errors

---

## Next Steps After Going Live

1. **Invite Friends**
   - Share your Discord server link
   - Show them how to launch WordHex

2. **Monitor Usage**
   - Check Supabase dashboard for activity
   - Watch for errors in deployment logs

3. **Share Feedback**
   - Test all features thoroughly
   - Note any bugs or improvements

4. **Scale If Needed**
   - Supabase free tier: 500MB database, 2GB bandwidth/month
   - Cloudflare Pages: Unlimited bandwidth
   - Upgrade if you get popular!

---

## Support Resources

**Documentation:**
- [`QUICK_DEPLOY.md`](./QUICK_DEPLOY.md) - Fast deployment guide
- [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md) - Complete guide
- [`README.md`](./README.md) - Full documentation

**Discord Resources:**
- [Discord Activities Docs](https://discord.com/developers/docs/activities/overview)
- [Discord Developer Server](https://discord.gg/discord-developers)

**Deployment Platforms:**
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Netlify Docs](https://docs.netlify.com/)
- [Vercel Docs](https://vercel.com/docs)

---

## Your Deployment URL

After deploying, add your URL here:

**Deployment URL:** `_________________________`

**Discord Activity URL:** https://discord.com/developers/applications/1433031616262832239/activities

**App Status:** ⏳ Ready to Deploy

Once deployed, update the Discord Developer Portal with your URL and you're LIVE! 🎉
