import { createEventSchema, eventQuerySchema } from '../../src/validators/eventValidators.js';
import { createParticipantSchema } from '../../src/validators/participantValidators.js';
import { loginSchema } from '../../src/validators/authValidators.js';
import { dayBounds } from '../../src/utils/date.js';
import { escapeLike } from '../../src/utils/query.js';
import { authorizeRoles } from '../../src/middlewares/roleMiddleware.js';
const event = {
  title: 'Event',
  location: 'Rabat',
  eventDate: '2030-01-01T10:00:00Z',
  maxParticipants: 1,
};
test('strict event validation rejects injected ownership, invalid dates and capacities', () => {
  expect(createEventSchema.parse(event).description).toBeNull();
  for (const invalid of [
    { ...event, createdBy: 'attacker' },
    { ...event, status: 'published' },
    { ...event, eventDate: '2030-02-30T10:00:00Z' },
    { ...event, maxParticipants: 0 },
    { ...event, maxParticipants: 1.5 },
  ])
    expect(createEventSchema.safeParse(invalid).success).toBe(false);
});
test('email normalization and pagination bounds', () => {
  expect(
    createParticipantSchema.parse({ fullName: ' Alex ', email: ' USER@Example.com ' }).email,
  ).toBe('user@example.com');
  expect(loginSchema.parse({ email: ' USER@Example.com ', password: '123' }).email).toBe(
    'user@example.com',
  );
  expect(eventQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
  expect(eventQuerySchema.safeParse({ page: 0 }).success).toBe(false);
  expect(eventQuerySchema.parse({ status: '', date: '' }).page).toBe(1);
});
test('LIKE metacharacters are escaped literally', () => {
  expect(escapeLike('a%_\\b')).toBe('%a\\%\\_\\\\b%');
});
test('organization day boundaries respect DST, not a fixed 24-hour interval', () => {
  expect(dayBounds('2026-03-08', 'America/New_York')).toEqual({
    start: '2026-03-08T05:00:00.000Z',
    end: '2026-03-09T04:00:00.000Z',
  });
  expect(dayBounds('2026-01-15', 'Africa/Casablanca')).toEqual({
    start: '2026-01-14T23:00:00.000Z',
    end: '2026-01-15T23:00:00.000Z',
  });
});
test('role authorization uses the authenticated database role', () => {
  let failure;
  authorizeRoles('admin')({ user: { role: 'staff' } }, {}, (error) => {
    failure = error;
  });
  expect(failure.status).toBe(403);
});
