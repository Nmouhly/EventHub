import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import dotenv from 'dotenv';
import pg from 'pg';

// Connect local development to the same PostgreSQL instance as Docker.
const root = new URL('../../', import.meta.url);
const backendEnv = new URL('../.env', import.meta.url);
const docker = dotenv.parse(await readFile(new URL('.env', root), 'utf8'));
if (!docker.POSTGRES_PASSWORD) throw new Error('Generate the root Docker .env first.');
const url = new URL('postgresql://eventhub_owner@127.0.0.1/eventhub');
url.port = docker.POSTGRES_PORT || '55433';
url.password = docker.POSTGRES_PASSWORD;
const db = new pg.Client({ connectionString: url.toString(), connectionTimeoutMillis: 5000 });
try {
  await db.connect();
  await db.query('SELECT 1 FROM events LIMIT 1');
} catch {
  throw new Error('Docker PostgreSQL is unavailable or uninitialized. Start Docker Compose first. No configuration changed.');
} finally {
  await db.end();
}
const previous = await readFile(backendEnv, 'utf8');
const backupFolder = new URL('.local/', root);
await mkdir(backupFolder, { recursive: true });
await copyFile(backendEnv, new URL(`backend-env-before-docker-${Date.now()}.local`, backupFolder));
const line = `DATABASE_URL=${url.toString()}`;
const next = /^DATABASE_URL=.*$/m.test(previous)
  ? previous.replace(/^DATABASE_URL=.*$/m, line)
  : `${previous.trimEnd()}\n${line}\n`;
await writeFile(backendEnv, next, { mode: 0o600 });
console.log('Local backend now targets Docker PostgreSQL. Restart the local backend to apply. Test database settings were preserved.');
