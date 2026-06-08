export const API_CONFIG = {
  BASE_URL: 'https://backend-42316129731.europe-west1.run.app',
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/Auth/login',
    ME: '/api/Auth/me',
  },
} as const;
