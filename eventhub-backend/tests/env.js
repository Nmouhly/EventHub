import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });
const testUrl = process.env.TEST_DATABASE_URL;
if (
  !testUrl ||
  !new URL(testUrl).pathname.endsWith('_test') ||
  testUrl === process.env.DATABASE_URL
)
  throw new Error('Tests require a separate TEST_DATABASE_URL ending in _test.');
process.env.DATABASE_URL = testUrl;
process.env.NODE_ENV = 'test';
