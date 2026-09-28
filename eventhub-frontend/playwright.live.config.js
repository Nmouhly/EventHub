import { defineConfig } from '@playwright/test';
import { browserDatabaseUrl } from '../eventhub-backend/scripts/browser-fixture.js';
export default defineConfig({
  testDir: './tests/live',
  timeout: 45000,
  workers: 1,
  use: {
    baseURL: 'http://localhost:5175',
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge',
  },
  webServer: [
    {
      command: 'node scripts/browser-fixture.js --prepare && node src/server.js',
      cwd: '../eventhub-backend',
      url: 'http://localhost:5001/api/health',
      timeout: 60000,
      reuseExistingServer: false,
      env: {
        DATABASE_URL: browserDatabaseUrl(),
        PORT: '5001',
        FRONTEND_URL: 'http://localhost:5175',
        NODE_ENV: 'test',
      },
    },
    {
      command: 'node node_modules/vite/bin/vite.js --port 5175 --strictPort',
      url: 'http://localhost:5175',
      reuseExistingServer: false,
      env: { VITE_USE_MOCKS: 'false', VITE_API_URL: 'http://localhost:5001/api' },
    },
  ],
});
