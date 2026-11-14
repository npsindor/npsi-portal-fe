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
    // Fixed values so the build never depends on a local .env (CI has none): the API is this origin, and a
    // reCAPTCHA site key is set so protected forms ask the test's stubbed grecaptcha for a token.
    env: { VITE_API_BASE_URL: ORIGIN, VITE_RECAPTCHA_SITE_KEY: 'playwright-test-site-key' },
    url: ORIGIN,
    // Always the build made for these tests: a preview left running on this port (built for the real API)
    // would silently answer with old code whose API calls the mocks can't serve.
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
