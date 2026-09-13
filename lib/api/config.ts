export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://backend-42316129731.europe-west1.run.app',
  TIMEOUT: 60000, // Default timeout: 60 seconds
  CAMERA_TIMEOUT: 120000, // Camera operations timeout: 120 seconds (RTSP connection + MediaMTX setup)
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
