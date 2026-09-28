import pg from 'pg';
import bcrypt from 'bcrypt';
import { readFile } from 'node:fs/promises';
import dotenv from 'dotenv';
dotenv.config({ path: new URL('../.env', import.meta.url), quiet: true });
export function browserDatabaseUrl() {
  if (!process.env.TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL is required.');
  const url = new URL(process.env.TEST_DATABASE_URL);
  if (!/^\/[a-z][a-z0-9_]*_test$/.test(url.pathname)) throw new Error('Unsafe test database name.');
  url.pathname = url.pathname.replace(/_test$/, '_browser_test');
  return url.toString();
}
export default async function setup() {
  const connectionString = browserDatabaseUrl();
  const url = new URL(connectionString);
  const name = url.pathname.slice(1);
  url.pathname = '/postgres';
  const admin = new pg.Client({ connectionString: url.toString() });
  await admin.connect();
  try {
    if (!(await admin.query('SELECT 1 FROM pg_database WHERE datname=$1', [name])).rowCount)
      await admin.query(`CREATE DATABASE "${name}"`);
  } finally {
    await admin.end();
  }
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    const actual = (await client.query('SELECT current_database() AS name')).rows[0].name;
    if (actual !== name || !actual.endsWith('_browser_test'))
      throw new Error('Refusing to reset an unexpected database.');
    if (!(await client.query("SELECT to_regclass('public.users') AS table")).rows[0].table)
      await client.query(
        await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8'),
      );
    await client.query('BEGIN');
    await client.query('TRUNCATE registrations,events,participants,users');
    await client.query("SELECT set_config('eventhub.seed_password_hash',$1,true)", [
      await bcrypt.hash('EventHub2026!', 12),
    ]);
    await client.query(await readFile(new URL('../database/seed.sql', import.meta.url), 'utf8'));
    await client.query('COMMIT');
    console.log(`Real PostgreSQL browser fixture ready: ${name}`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}
if (process.argv.includes('--prepare')) await setup();
