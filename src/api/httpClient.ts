import axios from 'axios'

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_MANPOWER_PLANNING_API_BASE_URL ?? 'http://localhost:8081/api/v1',
})
