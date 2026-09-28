import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { app } from '../../src/app.js';
import { pool } from '../../src/config/database.js';
import { env } from '../../src/config/env.js';
import { signToken } from '../../src/utils/jwt.js';
import { dayBounds } from '../../src/utils/date.js';
let admin, token, hash;
const auth = () => ({ Authorization: `Bearer ${token}` });
const eventBody = (extra = {}) => ({
  title: 'Test event',
  description: 'Description',
  location: 'Casablanca',
  eventDate: '2030-04-20T10:00:00Z',
  maxParticipants: 2,
  ...extra,
});
const createEvent = async (extra = {}) => {
  const response = await request(app).post('/api/events').set(auth()).send(eventBody(extra));
  expect(response.status).toBe(201);
  return response.body;
};
const publish = async (event) => {
  const response = await request(app)
    .patch(`/api/events/${event.id}/status`)
    .set(auth())
    .send({ status: 'published' });
  expect(response.status).toBe(200);
  return response.body;
};
let sequence = 0;
const participant = async (extra = {}) => {
  sequence++;
  const r = await request(app)
    .post('/api/participants')
    .set(auth())
    .send({ fullName: `Guest ${sequence}`, email: `guest${sequence}@example.com`, ...extra });
  expect(r.status).toBe(201);
  return r.body;
};
const register = (event, p) =>
  request(app)
    .post('/api/registrations')
    .set(auth())
    .send({ eventId: event.id, participantId: p.id });
const change = (id, status) =>
  request(app).patch(`/api/registrations/${id}/status`).set(auth()).send({ status });
const expectCode = (res, status, code) => {
  expect(res.status).toBe(status);
  expect(res.body.error.code).toBe(code);
  expect(res.body.error.stack).toBeUndefined();
};
beforeAll(async () => {
  const {
    rows: [{ name }],
  } = await pool.query('SELECT current_database() AS name');
  if (!name.endsWith('_test')) throw new Error('Refusing to clear a non-test database.');
  hash = await bcrypt.hash('EventHub2026!', 12);
});
beforeEach(async () => {
  await pool.query('TRUNCATE registrations,events,participants,users');
  admin = (
    await pool.query(
      "INSERT INTO users(full_name,email,password_hash,role) VALUES('Alex Morgan','admin@eventhub.demo',$1,'admin') RETURNING id,role",
      [hash],
    )
  ).rows[0];
  token = signToken(admin);
});
afterAll(async () => {
  await pool.end();
});
test('correct login, normalized email, JWT and /me contract', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: ' ADMIN@EventHub.demo ', password: 'EventHub2026!' });
  expect(res.status).toBe(200);
  expect(res.body.token).toBeTruthy();
  expect(res.body.user.password_hash).toBeUndefined();
  const profile = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${res.body.token}`);
  expect(profile.body).toMatchObject({
    id: admin.id,
    fullName: 'Alex Morgan',
    name: 'Alex Morgan',
    role: 'admin',
  });
});
test('incorrect password and unknown user return generic 401', async () => {
  for (const email of ['admin@eventhub.demo', 'nobody@example.com'])
    expectCode(
      await request(app).post('/api/auth/login').send({ email, password: 'wrong' }),
      401,
      'UNAUTHORIZED',
    );
});
test('inactive user cannot log in or use an existing JWT', async () => {
  await pool.query('UPDATE users SET is_active=false WHERE id=$1', [admin.id]);
  expectCode(
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@eventhub.demo', password: 'EventHub2026!' }),
    401,
    'UNAUTHORIZED',
  );
  expectCode(await request(app).get('/api/events').set(auth()), 401, 'UNAUTHORIZED');
});
test('missing, forged, malformed and expired JWT are rejected', async () => {
  const expired = jwt.sign({ role: 'admin' }, env.JWT_SECRET, {
    subject: admin.id,
    expiresIn: -1,
    issuer: 'eventhub',
    audience: 'eventhub-web',
  });
  for (const header of ['', 'Bearer invalid', `Bearer ${expired}`, 'Basic abc'])
    expectCode(
      await request(app).get('/api/events').set('Authorization', header),
      401,
      'UNAUTHORIZED',
    );
});
test('staff has access using the role reloaded from the database', async () => {
  await pool.query("UPDATE users SET role='staff' WHERE id=$1", [admin.id]);
  expect((await request(app).get('/api/auth/me').set(auth())).body.role).toBe('staff');
  await createEvent();
});
test('create event defaults to draft and derives ownership from authentication', async () => {
  const event = await createEvent();
  expect(event.status).toBe('draft');
  expect(event.createdBy.id).toBe(admin.id);
  expect(event.registeredParticipants).toBe(0);
  expectCode(
    await request(app)
      .post('/api/events')
      .set(auth())
      .send(eventBody({ createdBy: admin.id })),
    400,
    'VALIDATION_ERROR',
  );
});
test('publish draft and reject terminal or repeated transitions', async () => {
  const event = await publish(await createEvent());
  expectCode(
    await request(app)
      .patch(`/api/events/${event.id}/status`)
      .set(auth())
      .send({ status: 'published' }),
    409,
    'INVALID_EVENT_STATUS_TRANSITION',
  );
  expect(
    (
      await request(app)
        .patch(`/api/events/${event.id}/status`)
        .set(auth())
        .send({ status: 'cancelled' })
    ).status,
  ).toBe(200);
  expectCode(
    await request(app)
      .patch(`/api/events/${event.id}/status`)
      .set(auth())
      .send({ status: 'published' }),
    409,
    'INVALID_EVENT_STATUS_TRANSITION',
  );
});
test('cannot register on draft or nonexistent event', async () => {
  const e = await createEvent(),
    p = await participant();
  expectCode(await register(e, p), 409, 'EVENT_NOT_PUBLISHED');
  expectCode(
    await register({ id: '99999999-0000-4000-8000-000000000001' }, p),
    404,
    'EVENT_NOT_FOUND',
  );
});
test('published registration succeeds, consumes capacity and rejects duplicate', async () => {
  const e = await publish(await createEvent()),
    p = await participant();
  const first = await register(e, p);
  expect(first.status).toBe(201);
  expect(first.body.status).toBe('pending');
  expect(first.body.participant.email).toBe(p.email);
  expectCode(await register(e, p), 409, 'ALREADY_REGISTERED');
  expect(
    (await request(app).get(`/api/events/${e.id}`).set(auth())).body.registeredParticipants,
  ).toBe(1);
});
test('full event rejects new registrations; pending consumes a place', async () => {
  const e = await publish(await createEvent({ maxParticipants: 1 }));
  expect((await register(e, await participant())).status).toBe(201);
  expectCode(await register(e, await participant()), 409, 'EVENT_FULL');
});
test('event cancellation atomically cancels pending and confirmed registrations', async () => {
  const e = await publish(await createEvent());
  const a = (await register(e, await participant())).body,
    b = (await register(e, await participant())).body;
  expect((await change(b.id, 'confirmed')).status).toBe(200);
  const cancelled = await request(app)
    .patch(`/api/events/${e.id}/status`)
    .set(auth())
    .send({ status: 'cancelled' });
  expect(cancelled.body.cancelledAt).toBeTruthy();
  expect(cancelled.body.registeredParticipants).toBe(0);
  const rows = (
    await pool.query('SELECT status,cancelled_at FROM registrations WHERE event_id=$1', [e.id])
  ).rows;
  expect(rows).toHaveLength(2);
  expect(rows.every((r) => r.status === 'cancelled' && r.cancelled_at)).toBe(true);
  expectCode(await change(a.id, 'pending'), 409, 'EVENT_NOT_PUBLISHED');
});
test('reactivation via POST and PATCH checks capacity and reuses the same row', async () => {
  const e = await publish(await createEvent({ maxParticipants: 1 })),
    p = await participant();
  const a = (await register(e, p)).body;
  expect((await change(a.id, 'cancelled')).status).toBe(200);
  const b = (await register(e, await participant())).body;
  expectCode(await register(e, p), 409, 'EVENT_FULL');
  expectCode(await change(a.id, 'confirmed'), 409, 'EVENT_FULL');
  await change(b.id, 'cancelled');
  const again = await register(e, p);
  expect(again.status).toBe(201);
  expect(again.body.id).toBe(a.id);
  expect(again.body.cancelledAt).toBeNull();
  await change(a.id, 'cancelled');
  const confirmed = await change(a.id, 'confirmed');
  expect(confirmed.status).toBe(200);
  expect(confirmed.body.cancelledAt).toBeNull();
});
test('capacity cannot be lowered below active registrations, rollback leaves event unchanged', async () => {
  const e = await publish(await createEvent());
  await register(e, await participant());
  await register(e, await participant());
  expectCode(
    await request(app)
      .put(`/api/events/${e.id}`)
      .set(auth())
      .send(eventBody({ maxParticipants: 1 })),
    409,
    'MAX_PARTICIPANTS_TOO_LOW',
  );
  expect((await request(app).get(`/api/events/${e.id}`).set(auth())).body.maxParticipants).toBe(2);
});
test('two simultaneous registrations compete for the last place on real PostgreSQL', async () => {
  const e = await publish(await createEvent({ maxParticipants: 1 })),
    a = await participant(),
    b = await participant();
  const responses = await Promise.all([register(e, a), register(e, b)]);
  expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
  expect(responses.find((r) => r.status === 409).body.error.code).toBe('EVENT_FULL');
  expect(
    (
      await pool.query(
        "SELECT count(*)::int AS n FROM registrations WHERE event_id=$1 AND status IN ('pending','confirmed')",
        [e.id],
      )
    ).rows[0].n,
  ).toBe(1);
});
test('concurrent event cancellation and creation leave no active registrations', async () => {
  const e = await publish(await createEvent()),
    p = await participant();
  const [creation, cancellation] = await Promise.all([
    register(e, p),
    request(app).patch(`/api/events/${e.id}/status`).set(auth()).send({ status: 'cancelled' }),
  ]);
  expect([201, 409]).toContain(creation.status);
  expect(cancellation.status).toBe(200);
  expect(
    (
      await pool.query(
        "SELECT count(*)::int AS n FROM registrations WHERE event_id=$1 AND status <> 'cancelled'",
        [e.id],
      )
    ).rows[0].n,
  ).toBe(0);
});
test('duplicate participant email is rejected after normalization', async () => {
  await participant({ email: 'Same@Example.com' });
  expectCode(
    await request(app)
      .post('/api/participants')
      .set(auth())
      .send({ fullName: 'Other', email: ' same@example.com ' }),
    409,
    'EMAIL_ALREADY_EXISTS',
  );
});
test('participant search is case-insensitive and escapes percent, underscore, backslash', async () => {
  await participant({ fullName: 'Literal %_\\ guest' });
  await participant({ fullName: 'Normal Guest' });
  for (const search of ['%_\\', 'literal']) {
    const res = await request(app).get('/api/participants').query({ search }).set(auth());
    expect(res.body.total).toBe(1);
  }
  expect(
    (await request(app).get('/api/participants').query({ search: "' OR 1=1 --" }).set(auth())).body
      .total,
  ).toBe(0);
});
test('participant read, update, deletion and FK restriction', async () => {
  const p = await participant();
  expect((await request(app).get(`/api/participants/${p.id}`).set(auth())).body.id).toBe(p.id);
  expect(
    (
      await request(app)
        .put(`/api/participants/${p.id}`)
        .set(auth())
        .send({ fullName: 'Updated', email: p.email })
    ).body.fullName,
  ).toBe('Updated');
  const e = await publish(await createEvent());
  await register(e, p);
  expectCode(
    await request(app).delete(`/api/participants/${p.id}`).set(auth()),
    409,
    'PARTICIPANT_HAS_REGISTRATIONS',
  );
  const empty = await participant();
  expect((await request(app).delete(`/api/participants/${empty.id}`).set(auth())).status).toBe(204);
});
test('pagination envelope, event filters, invalid UUID, JSON and CORS', async () => {
  await createEvent({ title: 'Unique search' });
  await createEvent();
  const page = await request(app).get('/api/events').query({ page: 2, limit: 1 }).set(auth());
  expect(page.body.pagination).toEqual({ page: 2, limit: 1, total: 2, totalPages: 2 });
  expect(page.body.data).toHaveLength(1);
  expect(
    (
      await request(app)
        .get('/api/events')
        .query({ search: 'Unique', status: 'draft', date: '2030-04-20' })
        .set(auth())
    ).body.total,
  ).toBe(1);
  expectCode(await request(app).get('/api/events/not-a-uuid').set(auth()), 400, 'VALIDATION_ERROR');
  expectCode(await request(app).get('/api/events?limit=101').set(auth()), 400, 'VALIDATION_ERROR');
  expectCode(
    await request(app)
      .post('/api/events')
      .set(auth())
      .set('Content-Type', 'application/json')
      .send('{'),
    400,
    'VALIDATION_ERROR',
  );
  expectCode(
    await request(app).get('/api/events').set(auth()).set('Origin', 'https://untrusted.example'),
    403,
    'FORBIDDEN',
  );
});
test('dashboard uses active capacities and organization day range, excluding next midnight', async () => {
  const e = await publish(await createEvent());
  const a = (await register(e, await participant())).body,
    b = (await register(e, await participant())).body;
  const { start, end } = dayBounds();
  await pool.query('UPDATE registrations SET created_at=$2 WHERE id=$1', [a.id, start]);
  await pool.query('UPDATE registrations SET created_at=$2 WHERE id=$1', [b.id, end]);
  await change(b.id, 'cancelled');
  await createEvent();
  const res = await request(app).get('/api/dashboard').set(auth());
  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({
    totalEvents: 2,
    publishedEvents: 1,
    todayRegistrations: 1,
    totalParticipants: 2,
  });
  expect(res.body.topEvents).toHaveLength(1);
  expect(res.body.topEvents[0]).toMatchObject({ registeredParticipants: 1, fillRate: 50 });
  expect(Array.isArray(res.body.upcomingEvents)).toBe(true);
});
