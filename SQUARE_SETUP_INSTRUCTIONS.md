# Square OAuth Setup Instructions

## Error You're Seeing
```
Error: Application does not have a Redirect URL registered in the Developer Console
```

## Solution: Register Redirect URL in Square

### Step 1: Access Square Developer Dashboard
1. Go to: **https://developer.squareup.com/apps**
2. Sign in with your Square account

### Step 2: Create or Select Application
- **If creating new app:**
  - Click **"Create App"**
  - Enter app name (e.g., "Lume POS Integration")
  - Select **"Sandbox"** environment for testing

- **If using existing app:**
  - Click on your app name to open it

### Step 3: Configure OAuth Redirect URL

1. In your app dashboard, look for **"OAuth"** or **"Credentials"** section in the left sidebar
2. Scroll to **"Redirect URL"** or **"OAuth Redirect URIs"** section
3. Click **"Add Redirect URL"** or similar button
4. Enter exactly this URL:
   ```
   http://localhost:3001/api/integrations/square/callback
   ```
5. Click **"Save"** or **"Add"**

**Important Notes:**
- The URL must match EXACTLY (including the protocol `http://`)
- Make sure there are no trailing slashes
- For production, you'll need to add your production domain URL

### Step 4: Get Your Credentials

While in the Square Developer Dashboard, copy these values:

#### For Sandbox Testing:
1. Find **"Sandbox Application ID"**
   - Usually starts with `sandbox-sq0idp-`
   - Copy this value

2. Find **"Sandbox Application Secret"**
   - Click "Show" to reveal it
   - Usually starts with `sandbox-sq0csp-`
   - Copy this value

3. **Optional:** Find **"Webhook Signature Key"** (if you want to test webhooks later)
   - In the Webhooks section
   - Copy the signature key

### Step 5: Update Your .env File

Edit `/home/saif/Projects/lume-app/.env` and add:

```env
# Square Sandbox Credentials
SQUARE_APPLICATION_ID="sandbox-sq0idp-YOUR-APP-ID-HERE"
SQUARE_APPLICATION_SECRET="sandbox-sq0csp-YOUR-SECRET-HERE"

# Optional - for webhook testing later
SQUARE_WEBHOOK_SIGNATURE_KEY="your-webhook-signature-key-here"
```

**Replace the placeholder values with your actual credentials from Square.**

### Step 6: Restart Your Dev Server

After updating the .env file:

```bash
# Stop the current server (Ctrl+C if running in terminal)
# Then restart:
npm run dev
```

### Step 7: Test the Connection

1. Go to: http://localhost:3001/settings
2. Click the **"Connect"** button on the Square card
3. You should now be redirected to Square's authorization page
4. Log in with your Square **sandbox** test account
5. Click **"Allow"** to authorize the application
6. You'll be redirected back to your settings page
7. Should see "Square connected successfully" message

---

## Production Setup (When Ready)

When deploying to production, you'll need to:

1. **Register production redirect URL:**
   ```
   https://yourdomain.com/api/integrations/square/callback
   ```

2. **Switch to production credentials:**
   ```env
   SQUARE_ENVIRONMENT="production"
   SQUARE_APPLICATION_ID="sq0idp-YOUR-PRODUCTION-ID"
   SQUARE_APPLICATION_SECRET="sq0csp-YOUR-PRODUCTION-SECRET"
   SQUARE_OAUTH_REDIRECT_URI="https://yourdomain.com/api/integrations/square/callback"
   ```

3. **Request production access** in Square Developer Dashboard (requires business verification)

---

## Troubleshooting

### Still getting "Redirect URL" error?
- Double-check the URL is exactly: `http://localhost:3001/api/integrations/square/callback`
- Make sure you saved the redirect URL in Square
- Try refreshing the Square Developer Dashboard page
- Wait a minute for changes to propagate

### "Invalid credentials" error?
- Verify you copied the **Sandbox** credentials (not production)
- Check there are no extra spaces in the .env file
- Restart the dev server after updating .env

### Can't find the OAuth section?
- Look for tabs/sections labeled: "OAuth", "Credentials", "API Keys", or "Settings"
- Different Square dashboard versions may have slightly different layouts

### Authorization page says "Invalid client_id"?
- Your SQUARE_APPLICATION_ID is incorrect
- Make sure you're using sandbox credentials for testing
- Verify the Application ID starts with `sandbox-sq0idp-`

---

## What Happens Next?

After successful connection:
1. ✅ Square access token is encrypted and stored in your database
2. ✅ Your restaurant's Square location is linked
3. ✅ You can click "Sync Now" to pull menu items from Square
4. ✅ Future menu changes in Square will sync automatically via webhooks (once webhook is configured)

---

## Quick Reference

**Your Current Configuration:**
- Environment: `sandbox` (testing mode)
- Redirect URI: `http://localhost:3001/api/integrations/square/callback`
- Encryption Key: ✅ Already configured

**What You Need to Add:**
- `SQUARE_APPLICATION_ID` - From Square Developer Dashboard
- `SQUARE_APPLICATION_SECRET` - From Square Developer Dashboard

**Optional for Later:**
- `SQUARE_WEBHOOK_SIGNATURE_KEY` - For automatic menu sync
