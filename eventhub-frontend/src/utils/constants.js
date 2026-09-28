export const EVENT_STATUS = { DRAFT: 'draft', PUBLISHED: 'published', CANCELLED: 'cancelled' };
export const REGISTRATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
};
export const SESSION_KEY = 'eventhub.session';
export const DEMO = import.meta.env.VITE_USE_MOCKS === 'true';
