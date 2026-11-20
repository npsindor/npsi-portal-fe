import { defineConfig, devices } from '@playwright/test';

// Browser tests: the built app, served by `vite preview`, with every API call
// answered by the test (tests/browser/mock-api.js), so no backend is needed.
// PLAYWRIGHT_PORT picks another port when 4173 is taken on this machine.
const PORT = Number(process.env.PLAYWRIGHT_PORT) || 4173;
const ORIGIN = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: ORIGIN, trace: 'retain-on-failure' },
  // `npm run test:browser` runs Chrome; `npm run test:browser:all` (ALL_BROWSERS=1) also runs Firefox, Safari (WebKit)
  // and phone-sized Chrome / Safari.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ...(process.env.ALL_BROWSERS
      ? [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
          { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
          { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
        ]
      : []),
  ],
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
