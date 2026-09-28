import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEvent, validateParticipant } from '../src/utils/validation.js';
test('event requires content and positive integer capacity', () => {
  const valid = {
    title: 'Meetup',
    description: 'A community event',
    location: 'Rabat',
    eventDate: '2027-01-01T12:00',
    maxParticipants: 25,
  };
  assert.deepEqual(validateEvent(valid), {});
  for (const capacity of [0, -1, 1.5, 'abc'])
    assert.ok(validateEvent({ ...valid, maxParticipants: capacity }).maxParticipants);
  assert.ok(validateEvent({ ...valid, title: '  ' }).title);
  assert.ok(validateEvent({ ...valid, eventDate: 'invalid' }).eventDate);
});
test('participant requires a name and valid email', () => {
  assert.deepEqual(validateParticipant({ fullName: 'Alex', email: 'alex@example.com' }), {});
  for (const email of ['', 'alex', 'alex@', 'alex@example', 'alex @example.com'])
    assert.ok(validateParticipant({ fullName: 'Alex', email }).email);
  assert.ok(validateParticipant({ fullName: '', email: 'alex@example.com' }).fullName);
});
