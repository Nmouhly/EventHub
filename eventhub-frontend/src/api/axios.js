import axios from 'axios';
import { SESSION_KEY, DEMO } from '../utils/constants';
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(SESSION_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem(SESSION_KEY);
      window.dispatchEvent(new Event('session-expired'));
    }
    return Promise.reject(error);
  },
);
const messages = {
  SELF_ACCESS_CHANGE: 'You cannot deactivate your own account or remove your administrator role.',
  LAST_ADMIN: 'At least one active administrator must remain.',
  USER_NOT_FOUND: 'The operator was not found.',
  EVENT_NOT_PUBLISHED: 'Registrations are only allowed for published events.',
  EVENT_FULL: 'This event has reached its maximum capacity.',
  ALREADY_REGISTERED: 'This participant is already registered for this event.',
  MAX_PARTICIPANTS_TOO_LOW: 'Capacity cannot be lower than the number of active registrations.',
  EMAIL_ALREADY_EXISTS: 'This email address is already in use.',
  PARTICIPANT_HAS_REGISTRATIONS: 'This participant has registrations and cannot be deleted.',
  INVALID_EVENT_STATUS_TRANSITION: 'This event status transition is not allowed.',
  INVALID_REGISTRATION_STATUS_TRANSITION: 'This registration status transition is not allowed.',
  EVENT_NOT_FOUND: 'The event was not found.',
  PARTICIPANT_NOT_FOUND: 'The participant was not found.',
  REGISTRATION_NOT_FOUND: 'The registration was not found.',
  TOO_MANY_REQUESTS: 'Too many login attempts. Please try again later.',
};
export function errorMessage(error) {
  const status = error.response?.status;
  return (
    messages[error.response?.data?.error?.code || error.response?.data?.code] ||
    {
      400: 'Please check the information entered.',
      401: 'Your session has expired or your credentials are incorrect.',
      403: 'Accès non autorisé',
      404: 'The requested resource was not found.',
      409: 'This change conflicts with existing data.',
      500: 'Something went wrong on the server. Please try again.',
    }[status] ||
    'Unable to connect. Please check your connection and try again.'
  );
}
export async function request(method, url, data, params) {
  if (DEMO) {
    const { mockRequest } = await import('../mocks/server');
    return mockRequest(method, url, data, params);
  }
  const response = await api.request({ method, url, data, params });
  return response.data;
}
export function listData(result) {
  return Array.isArray(result) ? result : result?.data || [];
}

// Selection forms need complete lists; table pages explicitly request their own page.
export async function getCollection(url, params = {}) {
  if (params.page || DEMO) return request('get', url, undefined, params);
  const first = await request('get', url, undefined, { ...params, page: 1, limit: 100 });
  if (Array.isArray(first)) return first;
  const items = [...listData(first)];
  const totalPages = first.pagination?.totalPages || Math.ceil((first.total || 0) / 100);
  for (let page = 2; page <= totalPages; page++) {
    const result = await request('get', url, undefined, { ...params, page, limit: 100 });
    items.push(...listData(result));
  }
  return items;
}
