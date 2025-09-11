# Backend Deployment Guide — shopify-dashboard

This document explains how to deploy the backend (Node + Express + Socket.IO + MongoDB) for the shopify-dashboard project, tradeoffs when using free tiers, environment variables required, and a recommended hosting choice for a portfolio project.

TL;DR
- Recommended single backend host: Fly.io (free allowance, persistent sockets, easy Docker deploy).
- Deploy order: Deploy backend first, then frontend (so the frontend can be configured with the final backend URL).
- Remove any secrets from repo and set them as host secrets/env variables.

What this backend contains
- Express-based API server (see `index.js`, `app.js`).
- Socket.IO setup for real-time notifications (cookies-based auth).
- MongoDB connection via `MONGODB_URI` (uses Mongoose).
- Cloudinary integration for media uploads.
- Shopify app session storage (MongoDB-backed) and shopify integrations.

Free-tier hosting tradeoffs (what you may face)
- Sleeping instances / cold starts: some free tiers suspend apps when idle → longer first response time.
- Limited monthly CPU / bandwidth / runtime credits: burst traffic or background jobs may exceed allowances.
- Connection limits and concurrent sockets may be capped.
- No guaranteed uptime or SLA; suitable for portfolios but not production-critical apps.
- Environment changes over time: some providers remove or change free tiers (Heroku/Render historically changed policies).

Recommended hosting choices (short)
- Fly.io (recommended): runs small VMs that support long-lived TCP/WebSocket connections, straightforward Docker support, free allowance for hobby projects.
- Railway: easy to use, but free quotas vary and sometimes limited; check current status.
- Render: previously offered free web services; verify current free-tier policy before choosing.
- Vercel / Netlify: great for frontend; NOT recommended for long-lived Socket.IO server processes.

Single recommended choice: Fly.io
- Why: supports WebSockets, persistent processes, easy to set secrets, integrates with Docker. For a portfolio-grade app where you need Socket.IO, Fly is a good balance between ease and free-tier capability.

Environment variables (required)
Copy these to your host's secrets manager. Example names used in the repo and expected by the app:
- MONGODB_URI — MongoDB Atlas connection string
- FRONTEND_URL — e.g. https://your-frontend.vercel.app (used for CORS/socket origin)
- CLOUDINARY_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- ACCESS_TOKEN_SECRET
- REFRESH_TOKEN_SECRET
- JWT_SECRET (if used)
- SESSION_SECRET
- SHOPIFY_API_KEY (if using Shopify features)
- SHOPIFY_API_SECRET
- SHOPIFY_APP_URL (only if running Shopify app locally with tunnel)
- NODE_ENV=production (recommended)

Security: remove `.env` from the repo
If you accidentally committed secrets (there is a `backend/.env` in the repo), remove it from the git index and add to `.gitignore`:

```powershell
# from repo root
git rm --cached backend/.env
Add-Content -Path .gitignore -Value "backend/.env"
git add .gitignore
git commit -m "remove backend .env from repo; use host secrets"
git push origin main
```

Minimal Dockerfile (recommended for Fly.io)
Place this at `backend/Dockerfile` (example):

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "index.js"]
```

Fly.io quick deploy steps (summary)
1. Install flyctl: https://fly.io/docs/hands-on/install-flyctl/
2. Login and create app:

```powershell
flyctl auth login
cd backend
flyctl launch --name shopify-dashboard-backend --no-deploy
```

3. Set secrets (replace values):

```powershell
flyctl secrets set MONGODB_URI="your_mongo_uri" ACCESS_TOKEN_SECRET="..." REFRESH_TOKEN_SECRET="..." FRONTEND_URL="https://your-frontend.vercel.app" CLOUDINARY_NAME="..." CLOUDINARY_API_KEY="..." CLOUDINARY_API_SECRET="..."
```

4. Deploy:

```powershell
flyctl deploy
```

5. After deploy, Fly provides a public domain like `shopify-dashboard-backend.fly.dev`. Use that as your backend base URL.

Vercel / Frontend notes
- After backend is available, set frontend env vars in Vercel: `VITE_API_URL=https://<backend-host>` and `VITE_SOCKET_URL=wss://<backend-host>`.

Health check and smoke test
- Verify backend is responding (replace host):

```powershell
curl https://<backend-host>/api/health
# or a simple GET to root if no health route
curl https://<backend-host>/
```

What else the repository might need before public deploy
- Remove secrets from the repository and history if necessary (use git-filter-repo or BFG to purge history if you committed secrets previously).
- Add `backend/Dockerfile` and `fly.toml` (Fly will generate fly.toml during `flyctl launch`).
- Add CI checks / linting for future changes.

Troubleshooting tips
- If Socket.IO fails to connect: confirm `VITE_SOCKET_URL` uses `wss://` and `FRONTEND_URL` is set on the backend.
- Check CORS origin in `index.js` uses `process.env.FRONTEND_URL`.
- If mongodb connection fails: re-check `MONGODB_URI` format and whitelist Fly/Vercel IPs on Atlas (Atlas allows 0.0.0.0/0 for testing but lock down for security).

Support & Next steps
- If you'd like, I can generate `backend/Dockerfile` and a `DEPLOYMENT.md` with exact env var names, or create a `fly.toml` and run through the `flyctl` commands interactively.

Deploying without Docker (recommended free-friendly option: Railway)
---------------------------------------------------------------
If you prefer not to use Docker, Railway is a straightforward option that can deploy Node apps directly from your GitHub repo and supports persistent WebSocket connections.

High level
- Connect your GitHub repo to Railway and create a new service.
- Set the service root to the `backend` directory so Railway runs your backend code.
- Configure the start command to use `npm start` (the repo already has `start` and `dev` scripts).
- Add the required environment variables in Railway's dashboard (see list above).

Steps (Railway)
1. Create a Railway account and create a new project: https://railway.app/
2. Choose "Deploy from GitHub" and select this repository.
3. When prompted, set the root directory to `/backend` so Railway detects `package.json` there.
4. Verify the start command (Railway usually auto-detects `npm start`) — otherwise set it to:

	npm start

5. Add environment variables in Railway's project settings (MONGODB_URI, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, FRONTEND_URL, CLOUDINARY_*, etc.).
6. Deploy and wait for Railway to build and expose a public domain (e.g. `project.up.railway.app`).

Notes & tips
- Use `https://<railway-host>` as `VITE_API_URL` and `wss://<railway-host>` as `VITE_SOCKET_URL` in Vercel.
- Railway may put the app to sleep on heavy free-tier usage; it's still suitable for portfolio/demo projects.
- If you run into CORS/socket issues, confirm `FRONTEND_URL` matches your Vercel domain.

Decide deploy order
-------------------
- Deploy backend first so you have the final API and socket URLs.
- Then deploy frontend (Vercel) and set `VITE_API_URL` and `VITE_SOCKET_URL` to the backend host.

If you'd like, I can now remove Docker instructions from this README and generate a brief `DEPLOYMENT.md` focused only on Railway + Vercel steps.

---

