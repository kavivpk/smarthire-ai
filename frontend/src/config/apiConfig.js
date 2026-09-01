const rawApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').trim();

// Auto-normalize: Ensure API_BASE_URL always ends with '/api' without duplicate trailing slashes
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '').endsWith('/api')
  ? rawApiUrl.replace(/\/+$/, '')
  : `${rawApiUrl.replace(/\/+$/, '')}/api`;

export const BACKEND_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const rawAiUrl = (import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000').trim();
export const AI_SERVICE_URL = rawAiUrl.replace(/\/+$/, '');
