/**
 * Axios instance for unauthenticated public endpoints (/api/public/*).
 *
 * Intentionally separate from the authenticated `api` instance in axios.js:
 * - No Authorization header is attached.
 * - No 401 interceptor (public routes never return 401).
 * - Same baseURL and timeout as the main instance.
 *
 * Exported as a named instance so callers can pass an AbortController signal
 * directly to axios config, which the shared `request()` helper does not support.
 */
import axios from 'axios';

export const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});
