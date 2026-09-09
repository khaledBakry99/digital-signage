export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://backend-42316129731.europe-west1.run.app',
  TIMEOUT: 60000, // Increased from 30s to 60s to handle slow networks
  HEADERS: {
    'Content-Type': 'application/json',
  },
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/Auth/login',
    ME: '/api/Auth/me',
  },
  PASSWORD: {
    FORGOT_PASSWORD: '/api/password/forgot-password',
    RESET_PASSWORD: '/api/password/reset-password',
  },
} as const;
