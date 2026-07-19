export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
export const USE_MOCK_DATA = !import.meta.env.VITE_API_BASE_URL
export const MOCK_LATENCY_MS = 500
