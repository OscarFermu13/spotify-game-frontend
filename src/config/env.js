const required = {
  VITE_API_BASE: import.meta.env.VITE_API_BASE,
  VITE_FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL,
};

const missing = Object.entries(required)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missing.length > 0 && import.meta.env.PROD) {
  throw new Error(
    `[Config] Missing required environment variables in production:\n  ${missing.join('\n  ')}\n` +
    'Set them in your deployment environment or .env file.'
  );
} else if (missing.length > 0) {
  console.warn(
    `[Config] Missing env vars (falling back to localhost defaults):\n  ${missing.join(', ')}`
  );
}

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000';
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;