import assert from 'node:assert/strict';
const base = process.env.DOCKER_FRONTEND_URL || 'http://localhost:18080';
async function get(path, options) {
  return fetch(`${base}${path}`, { ...options, signal: AbortSignal.timeout(15000) });
}
const health = await get('/api/health');
assert.equal(health.status, 200, 'API health through Nginx');
assert.equal((await health.json()).status, 'ok');
assert.equal((await get('/api/events')).status, 401, 'Protected endpoint');
const login = await get('/api/auth/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@eventhub.demo', password: 'EventHub2026!' }),
});
assert.equal(login.status, 200, 'Run the database seed before this check');
const { token } = await login.json();
assert.equal(token.split('.').length, 3, 'Real JWT');
const headers = { Authorization: `Bearer ${token}` };
const me = await get('/api/auth/me', { headers });
assert.equal(me.status, 200);
assert.equal((await me.json()).role, 'admin');
const dashboard = await get('/api/dashboard', { headers });
assert.equal(dashboard.status, 200);
const stats = await dashboard.json();
assert.ok(stats.totalEvents >= 5, 'Seed events are present');
const page = await get('/events');
assert.equal(page.status, 200, 'React Router refresh fallback');
assert.match(await page.text(), /<div id="root"><\/div>/);
const catalogue = await get('/api/public/events');
assert.equal(catalogue.status, 200, 'Public catalogue without JWT');
const publicEvents = await catalogue.json();
assert.ok(Array.isArray(publicEvents.data));
for (const event of publicEvents.data) {
  assert.equal(event.createdBy, undefined, 'No organizer identity in public responses');
  assert.equal(event.participants, undefined, 'No participant list in public responses');
}
console.log('Docker checks passed: Nginx, API, PostgreSQL, JWT, dashboard, public catalogue and SPA fallback.');
