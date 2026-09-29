# Deploying the frontend

This is a static Vite/React build (`npm run build` → `dist/`), no server needed.

## Recommended: Vercel

1. Push this repo to GitHub.
2. On [vercel.com](https://vercel.com): **Add New → Project**, import this repo. Vercel
   auto-detects the Vite framework preset (build command `npm run build`, output `dist`).
3. Set the environment variable (Project Settings → Environment Variables):
   ```
   VITE_MANPOWER_PLANNING_API_BASE_URL=https://<your-backend-domain>/api/v1
   ```
4. Deploy. Note the resulting domain (e.g. `https://manpower-planning.vercel.app`).
5. Go back to the backend's deployment and set `CORS_ALLOWED_ORIGINS` to that exact
   domain, then redeploy the backend so it accepts requests from it.

## Alternative: Netlify

Same idea: **Add new site → Import from Git**, build command `npm run build`, publish
directory `dist`, set the same `VITE_MANPOWER_PLANNING_API_BASE_URL` env var under
Site settings → Environment variables.

## Why not the dev proxy in production?

Locally, `vite.config.ts` proxies `/api/*` to `http://localhost:8081` so the browser
never makes a cross-port request. That proxy only exists in Vite's *dev* server — a
production build is static files with no server behind them, so the app must call the
real backend URL directly (`VITE_MANPOWER_PLANNING_API_BASE_URL`), which is why the
backend's CORS config has to explicitly allow the deployed frontend's origin.

## Verifying after deploy

Open the deployed URL, open browser dev tools → Network tab, and confirm requests to
`/organizations`, `/planning-periods`, etc. hit your backend domain and return 200 —
not `ERR_NETWORK` / CORS errors. If you see a CORS error, double-check
`CORS_ALLOWED_ORIGINS` on the backend matches the frontend's exact origin (scheme +
host, no trailing slash).

## Local production build sanity check

```bash
npm run build
npm run preview
```
