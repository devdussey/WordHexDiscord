# WordHex - Potential User Errors & Troubleshooting Guide

This document outlines all potential errors users may encounter when launching and using the WordHex application, along with their solutions.

## 🚀 Application Launch Issues

### 1. **Application Won't Load / Blank Screen**

**Symptoms:**
- White/blank screen when visiting https://wordhex.vercel.app
- Page loads but nothing appears
- Stuck on loading

**Possible Causes:**
- ❌ Missing environment variables (FIXED - all required vars now set)
- ❌ Supabase client initialization failure
- ❌ JavaScript errors in browser console

**Solutions:**
```
1. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Check browser console (F12) for errors
4. Try a different browser
5. Ensure JavaScript is enabled
```

**Status:** ✅ RESOLVED - All environment variables are now configured

---

### 2. **Environment Variable Errors**

**Error Message:**
```
"Missing Supabase environment variables"
```

**Location:** `src/lib/supabase.ts:6-8`

**Cause:** Missing `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY`

**Status:** ✅ FIXED - All variables set in Vercel

**Required Environment Variables (Frontend):**
- ✅ `VITE_SUPABASE_URL` - Supabase project URL
- ✅ `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- ✅ `VITE_DISCORD_CLIENT_ID` - Discord Application ID
- ✅ `VITE_API_URL` - API endpoint URL

---

## 🔐 Authentication Errors

### 3. **Login Failures**

**Error: "Username already taken"**
- **Cause:** Attempting to sign up with an existing username
- **Solution:** Use a different username or try signing in instead
- **Location:** `src/contexts/AuthContext.tsx:88`

**Error: "Invalid credentials"**
- **Cause:** Incorrect password
- **Solution:** Reset password or create a new account
- **Location:** `src/contexts/AuthContext.tsx:170`

**Error: "Failed to sign up"**
- **Cause:** Database error or network issue
- **Check:** Browser console for detailed error
- **Solution:** Try again or contact support

---

### 4. **Session Persistence Issues**

**Symptoms:**
- User gets logged out when refreshing page
- Session doesn't persist across browser sessions

**Cause:** LocalStorage issues or session check failure

**Location:** `src/contexts/AuthContext.tsx:43-74`

**Solutions:**
```
1. Ensure browser allows localStorage
2. Check if in private/incognito mode (localStorage may be cleared)
3. Check browser console for errors during session check
4. Try logging in again
```

---

## 🎮 Gameplay Errors

### 5. **Game Won't Start / Stuck on Loading**

**Symptoms:**
- After clicking "Play", game doesn't load
- Lobby screen freezes
- Infinite loading spinner

**Possible Causes:**
- API endpoint not responding
- Supabase connection failure
- Network timeout

**Solutions:**
```
1. Check internet connection
2. Check browser console for API errors
3. Try refreshing the page
4. Check API health: https://wordhex.vercel.app/api/test
```

---

### 6. **API Connection Errors**

**Error: "API error: [status code]"**

**Location:** `src/lib/api.ts:30-32`

**Common Scenarios:**

**404 Not Found:**
- Endpoint doesn't exist
- Check `VITE_API_URL` is set correctly
- Solution: Ensure using latest deployment

**500 Internal Server Error:**
- Server-side error
- Check Vercel function logs
- May be Supabase connection issue

**Network Error / CORS:**
- Cross-origin request blocked
- Check CORS headers in `vercel.json`
- Status: ✅ CORS configured correctly

---

### 7. **Word Validation Failures**

**Symptoms:**
- Valid words not accepted
- Invalid words accepted

**Location:** `src/lib/wordlist.ts`

**Cause:** Wordlist may need updates or contain errors

**Solution:**
- Report specific words that don't work
- Wordlist can be updated in codebase

---

## 🌐 Discord Activity Issues

### 8. **Discord Activity Won't Launch**

**Error: "Discord SDK initialization error"**

**Location:** `src/main.tsx:104-114`

**Possible Causes:**
- Not running inside Discord
- Missing `frame_id` parameter
- Discord SDK timeout (>10 seconds)

**Solutions:**
```
1. Ensure launching from Discord (not web browser directly)
2. Check Discord Developer Portal settings:
   - URL Mappings: / → https://wordhex.vercel.app
   - OAuth2 Redirects: https://wordhex.vercel.app
3. Restart Discord client
4. Wait 5-10 minutes after updating Discord settings
```

**Status:** ⚠️ NOT TESTED - Requires Discord Activity setup

---

### 9. **Discord Authorization Failure**

**Error: "Discord authorization failed"**

**Location:** `src/main.tsx:156-174`

**Note:** App continues in "limited mode" - this is expected behavior

**Cause:**
- User denied authorization
- OAuth2 settings incorrect
- Discord API rate limit

**Impact:** Limited features (may not get user's Discord info)

---

## 💾 Database Errors

### 10. **Failed to Create Player Stats**

**Error Message:** Console warning only (doesn't block user)

**Location:**
- `src/contexts/AuthContext.tsx:123-126`
- `api/auth/login.js:69-84`
- `api/auth/guest.js:119-134`

**Cause:** RLS (Row Level Security) policy or database issue

**Impact:** User can still play, but stats won't track

**Solution:** Should auto-resolve; if persistent, check Supabase RLS policies

---

### 11. **Duplicate Key Violations**

**Error: "duplicate key value violates unique constraint"**

**Examples:**
- `idx_users_username_lower` - Username already exists
- `idx_server_id_unique` - Server record already exists

**Solution:** Use different username or handle gracefully in UI

---

## 🔌 Network & Performance Issues

### 12. **Slow Loading / Timeouts**

**Symptoms:**
- App takes >10 seconds to load
- API requests timeout
- WebSocket connection fails (no multiplayer)

**Causes:**
- Vercel cold start (first request after inactivity)
- Poor internet connection
- Supabase database slow query

**Solutions:**
```
1. Wait for cold start to complete (usually <5 seconds)
2. Check internet connection
3. Try different network
4. Check Vercel status page
```

**Note:** ⚠️ WebSocket support removed (Vercel limitation)
- Multiplayer features require Supabase Realtime instead

---

### 13. **Offline / Network Errors**

**Status:** ✅ Handled by OfflineBanner component

**Location:** `src/components/ErrorNotification.tsx`

**User sees:** Banner notification when offline

**Features:**
- Auto-detects network status
- Shows offline banner
- Hides when connection restored

---

## 🎨 UI/UX Issues

### 14. **Images Not Loading**

**Symptoms:**
- Missing logo (`/Dorion_zIkK0aVc6b.png`)
- Broken image icons

**Cause:** Assets not deployed or incorrect path

**Solution:** Check `/public` directory contains required assets

---

### 15. **Layout Issues / Mobile Display**

**Symptoms:**
- UI doesn't fit screen
- Buttons cut off
- Text overflow

**Status:** Should be responsive (Tailwind CSS)

**Solution:**
- Try rotating device
- Zoom out if needed
- Report specific device/browser combo

---

## 🛠️ Developer-Only Errors

### 16. **Build Errors**

**Common Build Failures:**

**Missing Dependencies:**
```bash
npm install
```

**TypeScript Errors:**
```bash
npm run typecheck
```

**Linting Errors:**
```bash
npm run lint
```

---

### 17. **Serverless Function Errors**

**Error: "FUNCTION_INVOCATION_FAILED"**

**Cause:** Serverless function crashed or timed out

**Check:** Vercel function logs
```bash
vercel logs https://wordhex.vercel.app
```

**Common Causes:**
- Missing environment variables in Vercel
- Supabase connection failure
- Function timeout (10s limit)

---

## 📊 Current Status Summary

| Feature/Component | Status | Notes |
|-------------------|--------|-------|
| Frontend Loading | ✅ Working | All env vars set |
| Authentication | ✅ Working | Sign in/up functional |
| API Endpoints | ✅ Working | All 5 routes operational |
| Supabase Connection | ✅ Working | Both frontend & backend |
| Database | ✅ Clean | Reset complete |
| Discord SDK | ⚠️ Untested | Requires Discord Activity setup |
| Multiplayer | ❌ Disabled | WebSocket not supported on Vercel |
| Shop Power-ups | ⚠️ Partial | UI works, effects not implemented |
| Leaderboard | ✅ Working | Empty but functional |

---

## 🐛 Known Issues

### Critical:
1. ❌ **Multiplayer disabled** - No real-time gameplay (WebSocket removed)
2. ❌ **Shop power-ups don't work** - Can purchase but no effect

### Minor:
1. ⚠️ **Discord Activity not tested** - May have integration issues
2. ⚠️ **No password reset** - Users can't recover forgotten passwords
3. ⚠️ **Stats may not create** - Non-blocking but affects leaderboard

---

## 🔍 Debugging Checklist

When a user reports an error:

1. **Check Browser Console (F12)**
   - Look for red error messages
   - Note specific error text
   - Check Network tab for failed requests

2. **Verify Environment**
   - Is user logged in?
   - What browser/device?
   - Inside Discord or standalone?

3. **Test API Health**
   ```bash
   curl https://wordhex.vercel.app/api/test
   ```
   Should return: `{"message":"API is working!","env":{...}}`

4. **Check Vercel Logs**
   ```bash
   vercel logs https://wordhex.vercel.app
   ```

5. **Check Supabase Dashboard**
   - Recent error logs
   - Database connection issues
   - RLS policy violations

---

## 📞 Support Resources

- **GitHub Issues:** https://github.com/devdussey/Word-Hex/issues
- **Deployment:** https://vercel.com/devdusseys-projects/wordhex
- **Database:** https://supabase.com (project: zxikrzkkmfwfjlqnwyxy)
- **Discord Developer Portal:** https://discord.com/developers/applications/1433031616262832239

---

## 🔧 Quick Fixes

**Reset User Session:**
```javascript
// Run in browser console
localStorage.removeItem('wordhex_session');
location.reload();
```

**Test API Manually:**
```bash
# Guest account
curl -X POST https://wordhex.vercel.app/api/auth/guest

# Leaderboard
curl https://wordhex.vercel.app/api/game/leaderboard
```

**Clear All Data:**
```javascript
// Run in browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

*Last Updated: 2025-10-30*
*Version: 1.0 (Post-Serverless Migration)*
