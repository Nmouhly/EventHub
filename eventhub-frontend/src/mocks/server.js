import { seedData } from './data';
import { EVENT_STATUS as E, REGISTRATION_STATUS as R, SESSION_KEY } from '../utils/constants';
const STORAGE = 'eventhub.demo.v1';
const TOKEN = 'eventhub-demo-session';
function read() {
  try {
    const saved = localStorage.getItem(STORAGE);
    if (saved) return JSON.parse(saved);
  } catch {
    /* Start with a fresh demo if stored data is corrupt. */
  }
  return seedData();
}
function fail(status, code) {
  throw { response: { status, data: { code } } };
}
function page(items, params) {
  if (!params?.page) return items;
  const start = (Number(params.page) - 1) * Number(params.limit || 8);
  return { data: items.slice(start, start + Number(params.limit || 8)), total: items.length };
}
export async function mockRequest(method, url, payload, params = {}) {
  await new Promise((resolve) => setTimeout(resolve, 220));
  const db = read();
  const save = () => localStorage.setItem(STORAGE, JSON.stringify(db));
  const count = (id) =>
    db.registrations.filter((r) => r.eventId === id && r.status !== R.CANCELLED).length;
  const eventView = (e) => ({ ...e, registeredParticipants: count(e.id) });
  const registrationView = (r) => ({
    ...r,
    participant: db.participants.find((p) => p.id === r.participantId),
    event: db.events.find((e) => e.id === r.eventId),
  });
  if (url === '/auth/login' && method === 'post') {
    if (payload.email !== db.user.email || payload.password !== 'EventHub2026!') fail(401);
    save();
    return { token: TOKEN };
  }
  if (sessionStorage.getItem(SESSION_KEY) !== TOKEN) {
    window.dispatchEvent(new Event('session-expired'));
    fail(401);
  }
  if (url === '/auth/me') return db.user;
  if (url === '/dashboard') {
    const events = db.events.map(eventView);
    return {
      totalEvents: events.length,
      publishedEvents: events.filter((e) => e.status === E.PUBLISHED).length,
      totalParticipants: db.participants.length,
      todayRegistrations: db.registrations.filter(
        (r) => new Date(r.createdAt).toDateString() === new Date().toDateString(),
      ).length,
      topEvents: events
        .filter((e) => e.status === E.PUBLISHED)
        .sort(
          (a, b) =>
            b.registeredParticipants / b.maxParticipants -
            a.registeredParticipants / a.maxParticipants,
        )
        .slice(0, 5),
      upcomingEvents: events
        .filter((e) => new Date(e.eventDate) >= new Date() && e.status !== E.CANCELLED)
        .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
        .slice(0, 4),
    };
  }
  const [, collection, id, action] = url.split('/');
  if (collection === 'users') {
    if (db.user.role.toLowerCase() !== 'admin') fail(403);
    db.users ||= [
      {
        id: db.user.id,
        fullName: db.user.name,
        email: db.user.email,
        role: 'admin',
        isActive: true,
      },
    ];
    if (method === 'get')
      return page(
        db.users.filter((u) =>
          `${u.fullName} ${u.email}`.toLowerCase().includes((params.search || '').toLowerCase()),
        ),
        params,
      );
    const { password: ignoredPassword, ...data } = payload;
    data.email = data.email.trim().toLowerCase();
    if (db.users.some((u) => u.id !== id && u.email === data.email))
      fail(409, 'EMAIL_ALREADY_EXISTS');
    if (method === 'post') {
      const created = { ...data, id: crypto.randomUUID() };
      db.users.unshift(created);
      save();
      return created;
    }
    if (method === 'put') {
      const target = db.users.find((u) => u.id === id);
      if (!target) fail(404, 'USER_NOT_FOUND');
      if (id === db.user.id && (!data.isActive || data.role !== 'admin'))
        fail(409, 'SELF_ACCESS_CHANGE');
      Object.assign(target, data);
      if (id === db.user.id) Object.assign(db.user, { name: data.fullName, email: data.email });
      save();
      return target;
    }
    fail(404);
  }
  if (!['events', 'participants', 'registrations'].includes(collection)) fail(404);
  if (method === 'delete' && collection === 'participants') {
    if (!db.participants.some((p) => p.id === id)) fail(404);
    if (db.registrations.some((r) => r.participantId === id))
      fail(409, 'PARTICIPANT_HAS_REGISTRATIONS');
    db.participants = db.participants.filter((p) => p.id !== id);
    save();
    return null;
  }
  if (method === 'get') {
    if (id) {
      const item = db[collection].find((item) => item.id === id);
      if (!item) fail(404);
      return collection === 'events' ? eventView(item) : item;
    }
    let items = db[collection];
    if (params.status) items = items.filter((i) => i.status === params.status);
    if (params.date) items = items.filter((i) => i.eventDate?.slice(0, 10) === params.date);
    if (params.eventId) items = items.filter((i) => i.eventId === params.eventId);
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter((i) =>
        `${i.title || ''} ${i.fullName || ''} ${i.email || ''}`.toLowerCase().includes(q),
      );
    }
    return page(
      items.map(
        collection === 'events'
          ? eventView
          : collection === 'registrations'
            ? registrationView
            : (i) => i,
      ),
      params,
    );
  }
  if (method === 'post') {
    let item = { ...payload, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    if (collection === 'events') item = { ...item, status: E.DRAFT, createdBy: db.user };
    if (
      collection === 'participants' &&
      db.participants.some((p) => p.email.toLowerCase() === payload.email.toLowerCase())
    )
      fail(409);
    if (collection === 'registrations') {
      const event = db.events.find((e) => e.id === payload.eventId);
      if (!event || !db.participants.some((p) => p.id === payload.participantId)) fail(404);
      if (event.status !== E.PUBLISHED) fail(409, 'EVENT_NOT_PUBLISHED');
      const existing = db.registrations.find(
        (r) => r.eventId === payload.eventId && r.participantId === payload.participantId,
      );
      if (existing && existing.status !== R.CANCELLED) fail(409, 'ALREADY_REGISTERED');
      if (count(event.id) >= event.maxParticipants) fail(409, 'EVENT_FULL');
      if (existing) {
        existing.status = R.PENDING;
        existing.cancelledAt = null;
        save();
        return registrationView(existing);
      }
      item.status = R.PENDING;
    }
    db[collection].unshift(item);
    save();
    return item;
  }
  const item = db[collection].find((i) => i.id === id);
  if (!item) fail(404);
  if (method === 'put') {
    if (collection === 'events' && Number(payload.maxParticipants) < count(id)) fail(409);
    if (
      collection === 'participants' &&
      db.participants.some(
        (p) => p.id !== id && p.email.toLowerCase() === payload.email.toLowerCase(),
      )
    )
      fail(409);
    Object.assign(item, payload);
  } else if (method === 'patch' && action === 'status') {
    if (collection === 'events') {
      const allowed = {
        [E.DRAFT]: [E.PUBLISHED, E.CANCELLED],
        [E.PUBLISHED]: [E.CANCELLED],
        [E.CANCELLED]: [],
      };
      if (!allowed[item.status].includes(payload.status))
        fail(409, 'INVALID_EVENT_STATUS_TRANSITION');
      if (payload.status === E.CANCELLED)
        for (const registration of db.registrations.filter((r) => r.eventId === item.id)) {
          registration.status = R.CANCELLED;
          registration.cancelledAt = new Date().toISOString();
        }
    } else if (collection === 'registrations') {
      const allowed = {
        [R.PENDING]: [R.CONFIRMED, R.CANCELLED],
        [R.CONFIRMED]: [R.CANCELLED],
        [R.CANCELLED]: [R.PENDING, R.CONFIRMED],
      };
      if (!allowed[item.status].includes(payload.status))
        fail(409, 'INVALID_REGISTRATION_STATUS_TRANSITION');
      const event = db.events.find((e) => e.id === item.eventId);
      if (payload.status !== R.CANCELLED && event.status !== E.PUBLISHED)
        fail(409, 'EVENT_NOT_PUBLISHED');
      if (
        item.status === R.CANCELLED &&
        payload.status !== R.CANCELLED &&
        count(event.id) >= event.maxParticipants
      )
        fail(409, 'EVENT_FULL');
    }
    item.status = payload.status;
    item.cancelledAt = payload.status === R.CANCELLED ? new Date().toISOString() : null;
  } else fail(404);
  save();
  return item;
}
