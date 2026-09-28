import { defineConfig } from '@playwright/test';
const port = Number(process.env.PLAYWRIGHT_MOCK_PORT || 5174);
export default defineConfig({
  testDir: './tests/browser',
  timeout: 45000,
  use: {
    baseURL: `http://localhost:${port}`,
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge',
  },
  webServer: {
    command: `node node_modules/vite/bin/vite.js --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    env: { VITE_USE_MOCKS: 'true' },
    reuseExistingServer: false,
  },
});
