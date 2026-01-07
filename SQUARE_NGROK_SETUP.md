# Square OAuth with ngrok (HTTPS Tunnel)

## Problem
Square requires HTTPS redirect URLs, even for sandbox/localhost development.

## Solution: Use ngrok

ngrok creates a secure HTTPS tunnel to your local development server.

---

## Step 1: Install ngrok

### Option A: Download from website
1. Go to: https://ngrok.com/download
2. Sign up for a free account (required)
3. Download ngrok for your OS
4. Follow installation instructions

### Option B: Install via package manager (Linux/Mac)

**Linux:**
```bash
# Using snap
sudo snap install ngrok

# OR using apt (if available)
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

**Mac:**
```bash
brew install ngrok/ngrok/ngrok
```

---

## Step 2: Authenticate ngrok

After signing up at ngrok.com, you'll get an authtoken:

```bash
ngrok config add-authtoken YOUR_NGROK_TOKEN_HERE
```

---

## Step 3: Start Your Dashboard Server

Make sure your dashboard is running on port 3001:

```bash
cd /home/saif/Projects/lume-app
npm run dev
```

Keep this running in one terminal.

---

## Step 4: Start ngrok Tunnel

In a **new terminal window**, start ngrok:

```bash
ngrok http 3001
```

You'll see output like:
```
ngrok

Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:3001

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**Copy the HTTPS forwarding URL** (e.g., `https://abc123def456.ngrok-free.app`)

⚠️ **Important:** This URL changes every time you restart ngrok (unless you have a paid plan with custom domains).

---

## Step 5: Update Square Redirect URL

1. Go to: https://developer.squareup.com/apps
2. Open your application
3. Navigate to **OAuth** section
4. Add redirect URL using your ngrok URL:
   ```
   https://YOUR-NGROK-URL.ngrok-free.app/api/integrations/square/callback
   ```
   Replace `YOUR-NGROK-URL` with the actual subdomain from Step 4

5. Click **Save**

**Example:**
If your ngrok URL is `https://abc123def456.ngrok-free.app`, then add:
```
https://abc123def456.ngrok-free.app/api/integrations/square/callback
```

---

## Step 6: Update Your .env File

Update the redirect URI in your `.env`:

```bash
# Old (localhost):
# SQUARE_OAUTH_REDIRECT_URI="http://localhost:3001/api/integrations/square/callback"

# New (ngrok):
SQUARE_OAUTH_REDIRECT_URI="https://YOUR-NGROK-URL.ngrok-free.app/api/integrations/square/callback"
```

**Replace `YOUR-NGROK-URL` with your actual ngrok subdomain.**

---

## Step 7: Restart Dashboard Server

After updating .env:

```bash
# Stop the server (Ctrl+C)
# Restart:
npm run dev
```

---

## Step 8: Test Square Connection

1. Go to your **ngrok URL** (not localhost):
   ```
   https://YOUR-NGROK-URL.ngrok-free.app/settings
   ```

2. Log in to your dashboard

3. Click **Connect** on the Square card

4. Authorize the application in Square

5. You'll be redirected back and should see "Square connected successfully"

---

## Important Notes

### ngrok Free Tier Limitations
- URL changes every time you restart ngrok
- Each time ngrok restarts, you must:
  1. Update the redirect URL in Square Developer Dashboard
  2. Update `SQUARE_OAUTH_REDIRECT_URI` in your .env
  3. Restart your dashboard server

### Keep ngrok Running
- Keep the ngrok terminal window open while testing
- Don't close it or you'll lose the tunnel

### Access Dashboard via ngrok URL
- Always access via the ngrok HTTPS URL when testing Square OAuth
- `https://your-ngrok-url.ngrok-free.app` ✅
- `http://localhost:3001` ❌ (won't work for OAuth callback)

---

## Alternative: ngrok Paid Plan (Optional)

If you want a consistent URL that doesn't change:

**ngrok Pro ($8/month):**
- Custom subdomain: `https://lume-dev.ngrok.app`
- URL never changes
- Update Square redirect URL once
- No need to update .env every time

---

## Troubleshooting

### "Invalid redirect URI" error
- Make sure the URL in Square matches EXACTLY with your .env
- Check for trailing slashes (should NOT have one)
- Verify you're accessing via ngrok URL, not localhost

### ngrok tunnel not working
- Make sure your dashboard is running on port 3001
- Check that ngrok is pointing to the correct port: `ngrok http 3001`
- Try restarting both ngrok and your dashboard

### Can't access dashboard via ngrok URL
- Check if your firewall is blocking ngrok
- Make sure ngrok tunnel shows "online" status
- Try accessing the ngrok Web Interface at http://127.0.0.1:4040 to see requests

### Getting ngrok warning page
- On free tier, you may see an ngrok interstitial page
- Click "Visit Site" to continue
- This is normal for free tier

---

## Production Setup

For production, you won't need ngrok. Instead:

1. Deploy your app to a hosting provider with HTTPS (Vercel, Railway, etc.)
2. Use your production domain:
   ```
   https://yourdomain.com/api/integrations/square/callback
   ```
3. Register this URL in Square Developer Dashboard (production section)

---

## Quick Command Reference

```bash
# Start dashboard (Terminal 1)
cd /home/saif/Projects/lume-app
npm run dev

# Start ngrok tunnel (Terminal 2)
ngrok http 3001

# View ngrok requests (optional)
# Open in browser: http://127.0.0.1:4040
```

---

## Current Configuration Checklist

After setup, verify:
- ✅ Dashboard running on port 3001
- ✅ ngrok tunnel active and showing HTTPS URL
- ✅ Redirect URL added in Square Developer Dashboard (with YOUR ngrok URL)
- ✅ `SQUARE_OAUTH_REDIRECT_URI` in .env updated with ngrok URL
- ✅ `SQUARE_APPLICATION_ID` set in .env
- ✅ `SQUARE_APPLICATION_SECRET` set in .env
- ✅ Dashboard restarted after .env changes
- ✅ Accessing dashboard via ngrok HTTPS URL (not localhost)
