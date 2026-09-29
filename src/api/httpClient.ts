import axios from 'axios'

// In dev, requests go to the same origin as the frontend ('/api/v1/...') and Vite's dev
// server proxies them to the backend (see vite.config.ts). This avoids the browser ever
// making a cross-port request, which sidesteps CORS entirely and any browser-side
// extension/content-blocker that treats cross-port localhost calls as cross-site.
// For a production build pointing at a deployed backend, override via env var.
export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_MANPOWER_PLANNING_API_BASE_URL ?? '/api/v1',
})
