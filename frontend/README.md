# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:


## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
# Frontend Deployment Guide — shopify-dashboard (Vite + React)

This document explains how to build and deploy the frontend to Vercel, how it connects to the backend, which environment variables to set, and quick troubleshooting notes.

Overview
- This is a Vite + React app located in `/frontend`.
- The app expects the backend API URL via `VITE_API_URL` and websocket endpoint via `VITE_SOCKET_URL`.
- For deployment we recommend Vercel (automatic builds + simple env var management).

What we've built
- Single-page React app built with Vite.
- Uses `axios` with `import.meta.env.VITE_API_URL` in `frontend/src/lib/api.js`.
- Socket.IO client uses `import.meta.env.VITE_SOCKET_URL` in `frontend/src/lib/socket.js`.
- Uses httpOnly cookies for authentication and expects backend to support refresh tokens and cookie-based auth.

Environment variables (Vite)
- VITE_API_URL — e.g. `https://api-yourapp.fly.dev` (backend base URL)
- VITE_SOCKET_URL — e.g. `wss://api-yourapp.fly.dev` (WebSocket endpoint)

Important security note
- Do not place backend secrets (JWT secrets, database credentials, Cloudinary secrets) in frontend env vars — frontend variables are exposed to users.

Local development
```powershell
# from repo root
cd frontend
npm install
npm run dev
# open http://localhost:5173
```

Build for production
```powershell
cd frontend
npm run build
npm run preview # optional local preview
```

Vercel deployment steps (short)
1. Push your repo to GitHub (already pushed as you said).
2. In Vercel, import the repo and set the root directory to `/frontend`.
	- Build command: `npm run build`
	- Output directory: `dist`
3. Add environment variables in the Vercel project settings:
	- `VITE_API_URL` = `https://<backend-host>`
	- `VITE_SOCKET_URL` = `wss://<backend-host>`
4. Deploy — Vercel will build and publish your frontend.

Which to deploy first — backend or frontend?
- Deploy backend first. Reason: the frontend needs the final backend URL to be configured in Vercel (`VITE_API_URL` and `VITE_SOCKET_URL`). Deploying backend first makes it possible to configure the frontend with concrete endpoints and avoid trial deployments.

Smoke tests after deploy
- Visit your Vercel URL and ensure the app loads.
- Confirm the browser console shows socket connect attempts and API requests to your backend.

Troubleshooting
- If API calls return CORS errors: check backend `FRONTEND_URL` env var and CORS settings (backend `index.js` uses `process.env.FRONTEND_URL`).
- If sockets don't connect: ensure `VITE_SOCKET_URL` includes `wss://` and that the backend domain matches the socket domain and allows the origin.

Extras to add to repository (recommended)
- `frontend/README.md` (this file) — done.
- A top-level `DEPLOYMENT.md` that references both frontend and backend steps (I can create it if you want).

If you want, I can now:
- Add `backend/Dockerfile` and `fly.toml` example and commit them.
- Walk you through `flyctl` commands interactively and validate the endpoint and Vercel env settings.
