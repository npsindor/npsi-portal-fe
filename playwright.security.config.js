import { defineConfig } from '@playwright/test';

// Security checks against a real, running API (tests/security). No browser and no mocks;
// API_URL picks the server (default http://localhost:4000). See the spec header for the env vars.
export default defineConfig({
  testDir: './tests/security',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'security-report', open: 'never' }]],
});
