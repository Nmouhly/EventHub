import { readFile } from 'node:fs/promises';
import pg from 'pg';
import bcrypt from 'bcrypt';
import { env } from '../src/config/env.js';
const action = process.argv[2];
const test = process.argv.includes('--test');
const connectionString = test ? process.env.TEST_DATABASE_URL : env.DATABASE_URL;
if (!connectionString) throw new Error('TEST_DATABASE_URL is required.');
const url = new URL(connectionString);
const name = decodeURIComponent(url.pathname.slice(1));
if (!/^[a-z][a-z0-9_]*$/.test(name) || (test && !name.endsWith('_test')))
  throw new Error(
    'Unsafe database name. Use lowercase letters, digits and underscores; test DB must end in _test.',
  );
if (action === 'create') url.pathname = '/postgres';
const client = new pg.Client({ connectionString: url.toString() });
try {
  await client.connect();
  if (action === 'create') {
    const exists = await client.query('SELECT 1 FROM pg_database WHERE datname=$1', [name]);
    if (!exists.rowCount) await client.query(`CREATE DATABASE "${name}"`); // Identifiers cannot be bound; name is strictly allowlisted above.
    console.log(exists.rowCount ? `Database ${name} already exists.` : `Created ${name}.`);
  } else if (action === 'schema') {
    if ((await client.query("SELECT to_regclass('public.users') AS table")).rows[0].table)
      throw new Error('Schema already exists. No tables were changed.');
    await client.query(await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8'));
    console.log('Schema installed.');
  } else if (action === 'seed') {
    await client.query('BEGIN');
    await client.query('LOCK TABLE users, events, participants, registrations IN EXCLUSIVE MODE');
    const {
      rows: [{ occupied }],
    } = await client.query(
      'SELECT EXISTS(SELECT 1 FROM users UNION ALL SELECT 1 FROM events UNION ALL SELECT 1 FROM participants UNION ALL SELECT 1 FROM registrations) AS occupied',
    );
    if (occupied) throw new Error('Seed requires empty tables; existing data was not changed.');
    const hash = await bcrypt.hash('EventHub2026!', 12);
    await client.query("SELECT set_config('eventhub.seed_password_hash',$1,true)", [hash]);
    await client.query(await readFile(new URL('../database/seed.sql', import.meta.url), 'utf8'));
    await client.query('COMMIT');
    console.log('Seed installed: 2 operators, 5 events, 10 participants, 20 registrations.');
  } else throw new Error('Usage: node scripts/database.js create|schema|seed [--test]');
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  console.error(error.code || error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
