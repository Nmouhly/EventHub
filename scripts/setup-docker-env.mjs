import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
const target = new URL('../.env', import.meta.url);
try {
  writeFileSync(target, [
    `POSTGRES_PASSWORD=${randomBytes(24).toString('hex')}`,
    `JWT_SECRET=${randomBytes(48).toString('hex')}`,
    'FRONTEND_PORT=18080', 'BACKEND_PORT=5002', 'POSTGRES_PORT=55433', '',
  ].join('\n'), { flag: 'wx', mode: 0o600 });
  console.log('Docker .env created at the project root. Local application settings were preserved.');
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  console.log('Root .env already exists; no values were changed.');
}
