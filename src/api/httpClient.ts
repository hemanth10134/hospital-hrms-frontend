import axios from 'axios'

// In dev, requests go to the same origin as the frontend ('/api/v1/...') and Vite's dev
// server proxies them to the backend (see vite.config.ts). This avoids the browser ever
// making a cross-port request, which sidesteps CORS entirely and any browser-side
// extension/content-blocker that treats cross-port localhost calls as cross-site.
// For a production build pointing at a deployed backend, override via env var.
const baseURL = import.meta.env.VITE_MANPOWER_PLANNING_API_BASE_URL ?? '/api/v1'

if (!baseURL.endsWith('/api/v1')) {
  // Easy misconfiguration: setting the env var to the backend's bare domain instead of
  // "<domain>/api/v1". Every request would 404 with no clear signal why, so fail loud here.
  console.error(
    `[manpower-planning] VITE_MANPOWER_PLANNING_API_BASE_URL ("${baseURL}") does not end with ` +
      '"/api/v1" — API calls will likely 404. Did you forget the "/api/v1" suffix?',
  )
}

export const httpClient = axios.create({ baseURL })
