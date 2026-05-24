# InstaFlow — Instagram Comment-to-DM Automation

A self-hosted tool that watches your Instagram posts for keyword comments and automatically replies publicly **and** sends a private DM — built entirely on the official Instagram Graph API.

---

## Table of Contents

1. [How It Works](#how-it-works)
2. [Instagram & Facebook Developer Setup](#instagram--facebook-developer-setup)
3. [Local Development](#local-development)
4. [Environment Variables](#environment-variables)
5. [Deployment](#deployment)
6. [API Reference](#api-reference)
7. [DM Permission Limitation](#dm-permission-limitation)
8. [Token Refresh Guide](#token-refresh-guide)

---

## How It Works

```
User comments "free" on your post
        │
        ▼
Instagram sends webhook event → POST /webhook/instagram
        │
        ▼
App checks: Is this post tracked? Does comment contain a keyword?
        │
        ├─ YES → Deduplicate (skip if already processed)
        │           │
        │           ├─ Reply to comment (public)
        │           └─ Send DM to commenter (private)
        │
        └─ NO  → Ignore
```

---

## Instagram & Facebook Developer Setup

Follow these steps **exactly** — especially if you have never created a Facebook Developer App before.

### Step 1 — Convert your Instagram Account

Your Instagram account must be a **Business** or **Creator** account (not Personal).

1. Open the Instagram mobile app
2. Go to **Settings → Account → Switch to Professional Account**
3. Choose **Business** or **Creator**
4. Link it to a Facebook Page (required for API access)

---

### Step 2 — Create a Facebook Developer App

1. Go to [developers.facebook.com](https://developers.facebook.com) and log in with your Facebook account
2. Click **My Apps → Create App**
3. Choose **"Other"** → **"Business"** type → click Next
4. Give your app a name (e.g. "InstaFlow Bot") and enter your contact email
5. Click **Create App**

---

### Step 3 — Add the Instagram Graph API Product

1. In your App Dashboard, scroll to **"Add Products to Your App"**
2. Find **Instagram Graph API** and click **Set Up**
3. Also add **Messenger** product (needed for DM sending)

---

### Step 4 — Add Required Permissions

Navigate to **App Review → Permissions and Features** and request:

| Permission | Purpose |
|---|---|
| `instagram_manage_comments` | Read comments, post replies |
| `instagram_manage_messages` | Send DMs (requires approval — see below) |
| `instagram_basic` | Read basic profile info |
| `pages_show_list` | Discover linked Facebook Pages |
| `pages_read_engagement` | Read page data |

> **Note:** For development/testing, these permissions work in **Development Mode** for users listed as Testers or Developers in your app.

---

### Step 5 — Generate a Long-Lived Access Token

#### 5a. Get a Short-Lived Token

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your App from the dropdown
3. Click **"Generate Access Token"**
4. Add these permissions: `instagram_manage_comments`, `instagram_manage_messages`, `instagram_basic`, `pages_show_list`, `pages_read_engagement`
5. Click **Generate Access Token** and authorize

#### 5b. Exchange for a Long-Lived Token (60-day expiry)

```bash
curl -X GET "https://graph.facebook.com/v19.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id=YOUR_APP_ID
  &client_secret=YOUR_APP_SECRET
  &fb_exchange_token=SHORT_LIVED_TOKEN"
```

Copy the `access_token` from the response — this is your `INSTAGRAM_ACCESS_TOKEN`.

#### 5c. Get Your Instagram Business Account ID

```bash
# First, get your Page ID:
curl "https://graph.facebook.com/v19.0/me/accounts?access_token=YOUR_LONG_TOKEN"

# Then, get Instagram account linked to that page:
curl "https://graph.facebook.com/v19.0/YOUR_PAGE_ID?fields=instagram_business_account&access_token=YOUR_LONG_TOKEN"
```

The `id` inside `instagram_business_account` is your `INSTAGRAM_BUSINESS_ACCOUNT_ID`.

---

### Step 6 — Configure the Webhook

1. In your App Dashboard, go to **Webhooks** (left sidebar)
2. Click **Add Callback URL**
3. **Callback URL:** `https://YOUR_DEPLOYED_URL/webhook/instagram`
4. **Verify Token:** The same random string you set in `WEBHOOK_VERIFY_TOKEN` in your `.env`
5. Click **Verify and Save**
6. After verification, click **Add Subscriptions** → subscribe to:
   - `comments`
   - `messages` (if you want DM read receipts)

> **Webhook must be reachable from the internet.** For local dev, use [ngrok](https://ngrok.com):
> ```bash
> ngrok http 8000
> # Use the https://xxxx.ngrok.io URL as your Callback URL
> ```

---

### Step 7 — Find a Post ID

To get the numeric ID of a specific Instagram post:

```bash
curl "https://graph.facebook.com/v19.0/YOUR_IG_ACCOUNT_ID/media
  ?fields=id,caption,media_type,timestamp,permalink
  &access_token=YOUR_TOKEN"
```

Or use the **Graph API Explorer** with the query above. Copy the `id` field for the post you want to track.

---

## Local Development

```bash
# 1. Clone and set up
git clone <this-repo>
cd instagram-dm-tool

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 5. Run the server
uvicorn main:app --reload --port 8000

# 6. Open the dashboard
open http://localhost:8000
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `INSTAGRAM_ACCESS_TOKEN` | Yes | Long-lived User Access Token |
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | Yes | Your Instagram Business Account numeric ID |
| `FACEBOOK_APP_SECRET` | Yes | Found in App Dashboard → Settings → Basic |
| `WEBHOOK_VERIFY_TOKEN` | Yes | Random secret you choose; must match Facebook Webhook config |
| `DATABASE_URL` | No | Defaults to `sqlite:///./app.db` |

---

## Deployment

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

Set environment variables in the Railway dashboard under **Variables**.

### Render

1. Fork this repo to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Connect your GitHub repo
4. Render auto-detects `render.yaml`
5. Set environment variables in Render dashboard

### Docker

```bash
docker build -t instaflow .
docker run -d \
  -p 8000:8000 \
  -e INSTAGRAM_ACCESS_TOKEN=... \
  -e INSTAGRAM_BUSINESS_ACCOUNT_ID=... \
  -e FACEBOOK_APP_SECRET=... \
  -e WEBHOOK_VERIFY_TOKEN=... \
  -v $(pwd)/data:/app \
  instaflow
```

---

## API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Dashboard UI |
| `GET` | `/health` | Health check → `{"status": "ok"}` |
| `GET` | `/webhook/instagram` | Facebook challenge verification |
| `POST` | `/webhook/instagram` | Receives webhook events |
| `GET` | `/api/campaigns` | List all campaigns |
| `POST` | `/api/campaigns` | Create campaign |
| `GET` | `/api/campaigns/{id}` | Get campaign |
| `PUT` | `/api/campaigns/{id}` | Update campaign |
| `PATCH` | `/api/campaigns/{id}/toggle` | Toggle active/inactive |
| `DELETE` | `/api/campaigns/{id}` | Delete campaign |
| `GET` | `/api/post-preview/{post_id}` | Fetch post thumbnail + caption |
| `GET` | `/api/config` | Get saved config (token masked) |
| `POST` | `/api/config` | Save credentials |
| `GET` | `/api/stats` | Campaign + processing stats |
| `GET` | `/docs` | Swagger UI (auto-generated) |

---

## DM Permission Limitation

> ⚠️ **Important:** The Instagram Graph API has strict rules for sending DMs.

The `send_dm` function will **only work** if:

**Option A — User messaged first:**
The commenter has previously sent a message to your Instagram Business account. This is the easiest path for existing followers.

**Option B — `instagram_manage_messages` approved:**
Your Facebook App has been approved for **Standard Access** to `instagram_manage_messages`. To apply:

1. Go to **App Review → Permissions and Features**
2. Find `instagram_manage_messages` → click **Request Advanced Access**
3. Complete the business verification and use-case description
4. Approval typically takes 1–5 business days

Until approved, DM calls will return error code `551` or `10`. The comment reply will still work regardless.

---

## Token Refresh Guide

Long-lived tokens expire after **60 days**. Refresh them before expiry:

```bash
curl "https://graph.facebook.com/v19.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id=YOUR_APP_ID
  &client_secret=YOUR_APP_SECRET
  &fb_exchange_token=YOUR_CURRENT_LONG_TOKEN"
```

Update `INSTAGRAM_ACCESS_TOKEN` in your `.env` (or deployment environment) with the new token.

**Pro tip:** Set a calendar reminder for day 55 to refresh before expiry.

---

## Project Structure

```
/
├── main.py              # FastAPI app entry point
├── instagram.py         # Instagram Graph API client
├── models.py            # SQLAlchemy models
├── database.py          # DB session setup
├── routes/
│   ├── webhook.py       # Webhook endpoints (verify + receive)
│   ├── dashboard.py     # Dashboard HTML route
│   └── api.py           # REST API (campaigns, config, stats)
├── static/              # Static assets (CSS/JS if externalized)
├── templates/
│   └── dashboard.html   # Single-page dashboard
├── .env.example         # Template for environment variables
├── Dockerfile
├── railway.toml
├── render.yaml
├── requirements.txt
└── README.md
```

---

## Security Notes

- Webhook signature (`X-Hub-Signature-256`) is validated on every incoming POST
- Access tokens are stored in the database and masked in API responses
- Never commit `.env` to version control
- Run behind HTTPS in production (Railway/Render handle this automatically)
