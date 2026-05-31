# Deploy to Render (free, web-based, no terminal)

## 1. Create account
https://dashboard.render.com → Sign up with GitHub

## 2. New Web Service
Click **New +** → **Web Service**

## 3. Connect repo
Select `twoggo/unwrap-api`

## 4. Configure
Give it a name like `unwrap-api`

Scroll down to **Start Command** and enter:
```
npm start
```

But actually, let me switch to **Docker** mode. In the settings:
- **Runtime**: Choose `Docker`
- Render auto-detects the Dockerfile

Click **Advanced** → **Add Environment Variable** and add these:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `file:./data/unwrap.db` |
| `API_KEY_HASH_SALT` | `sdlfkj2398hj2k3h4jkh234kjh2` |
| `NODE_ENV` | `production` |

(Stripe keys can be added later when you set up billing)

## 5. Deploy
Click **Create Web Service** — Render builds and deploys automatically.

Your API will be at `https://unwrap-api.onrender.com`

## 6. Verify
Visit `https://unwrap-api.onrender.com/health`
