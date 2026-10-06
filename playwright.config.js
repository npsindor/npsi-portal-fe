import { defineConfig, devices } from '@playwright/test';

// Browser tests: the built app, served by `vite preview`, with every API call
// answered by the test (tests/browser/mock-api.js), so no backend is needed.
const PORT = 4173;
const ORIGIN = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: ORIGIN, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // The API base is the app's own origin, so the mocked calls are same-origin.
    command: `vite build && vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    env: { VITE_API_BASE_URL: ORIGIN },
    url: ORIGIN,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
