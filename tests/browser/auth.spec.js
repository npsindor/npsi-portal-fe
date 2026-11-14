import { expect, test } from '@playwright/test';
import { ADMIN, MEMBER, mockApi, NOT_LOGGED_IN } from './mock-api.js';

test('anonymous visitors stay on public pages (a 401 from /auth/me is not an error)', async ({ page }) => {
  const calls = await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /stats': { families: 54, members: 87 } });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(new URL(page.url()).pathname).toBe('/');
  expect(calls.some((c) => c.key === 'GET /auth/me')).toBe(true);
  await page.goto('/events');
  await page.waitForLoadState('networkidle');
  expect(new URL(page.url()).pathname).toBe('/events');
});

test('protected pages send anonymous visitors to the login page', async ({ page }) => {
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  await page.goto('/portal');
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fportal$/);
});

test('mobile signup requires an email fallback for OTP and password recovery', async ({ page }) => {
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  await page.goto('/register-account');
  await expect(page.locator('#otp-email')).toHaveAttribute('required', '');
});

test('signup falls back to email verification when the deployed API lacks mobile OTP routes', async ({ page }) => {
  let registration;
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  await page.addInitScript(() => {
    localStorage.setItem('pss_lang', 'en');
    window.grecaptcha = { ready: (callback) => callback(), execute: async () => 'test-recaptcha-token' };
  });
  await page.route('**/api/v1/auth/mobile-otps', (route) => route.fulfill({ status: 404, json: { error: 'Cannot POST /api/v1/auth/mobile-otps' } }));
  await page.route('**/api/v1/auth/registrations', async (route) => {
    registration = route.request().postDataJSON();
    return route.fulfill({ json: { user: MEMBER, requiresOtp: true } });
  });
  await page.route('**/api/v1/auth/otp-verifications', (route) => route.fulfill({ json: { user: MEMBER, accessToken: 'a'.repeat(64) }, headers: { 'Set-Cookie': 'npsi_session=x; Path=/; HttpOnly; SameSite=Strict' } }));
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({ json: MEMBER }));
  await page.goto('/register-account');
  await page.locator('#otp-mobile').fill('9926877375');
  await page.locator('#otp-email').fill('new-member@example.test');
  await page.getByRole('button', { name: 'Send code' }).click();
  await expect(page.getByText(/use an email verification code/i)).toBeVisible();
  await page.locator('#reg-name').fill('New Test Member');
  await page.locator('#reg-password').fill('Secret123');
  await page.locator('#reg-confirm').fill('Secret123');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('status')).toContainText('new-member@example.test');
  expect(registration).toMatchObject({ email: 'new-member@example.test', phone: '9926877375', fullName: 'New Test Member', password: 'Secret123', recaptchaToken: 'test-recaptcha-token' });
  await page.locator('#legacy-register-code').fill('123456');
  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page).toHaveURL(/\/portal\/registration$/);
});

test('password reset shows a rate-limit message when the API returns 429', async ({ page }) => {
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  await page.route('**/api/v1/auth/mobile-otps', (route) => route.fulfill({ status: 429, json: { error: 'Too many requests, please try again later.' } }));
  await page.goto('/forgot-password');
  await page.locator('#otp-mobile').fill('9926877375');
  await page.getByRole('button', { name: 'Send code' }).click();
  await expect(page.getByRole('alert')).toContainText('Too many attempts were made');
  await expect(page.getByRole('alert')).not.toContainText('could not be reached');
});

test('password reset explains when the login API cannot be reached', async ({ page }) => {
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  await page.route('**/api/v1/auth/mobile-otps', (route) => route.abort('connectionrefused'));
  await page.goto('/forgot-password');
  await page.locator('#otp-mobile').fill('9926877375');
  await page.getByRole('button', { name: 'Send code' }).click();
  await expect(page.getByRole('alert')).toContainText('The login service could not be reached');
});

test('password reset falls back to email when the deployed API lacks mobile OTP routes', async ({ page }) => {
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  await page.route('**/api/v1/auth/mobile-otps', (route) => route.fulfill({ status: 404, json: { error: 'Cannot POST /api/v1/auth/mobile-otps' } }));
  await page.goto('/forgot-password');
  await page.locator('#otp-mobile').fill('9926877375');
  await page.getByRole('button', { name: 'Send code' }).click();
  await expect(page.getByRole('tab', { name: 'Using email' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('alert')).toContainText('Enter your registered email');
  await expect(page.locator('#fp-email')).toBeVisible();
});

test('logging in relies on the session cookie: no token is kept in localStorage', async ({ page }) => {
  let loggedIn = false;
  const calls = await mockApi(page);
  await page.route('**/api/v1/auth/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/auth/sessions') && route.request().method() === 'POST') {
      loggedIn = true;
      return route.fulfill({ json: { user: ADMIN, accessToken: 'a'.repeat(64) }, headers: { 'Set-Cookie': 'npsi_session=x; Path=/; HttpOnly; SameSite=Strict' } });
    }
    if (path.endsWith('/auth/me')) return route.fulfill(loggedIn ? { json: ADMIN } : { status: 401, json: { error: 'Authentication required.' } });
    return route.fallback();
  });
  await page.goto('/login');
  await page.fill('#email', 'admin@example.com');
  await page.fill('#password', 'Secret@123');
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/\/admin$/);
  expect(await page.evaluate(() => localStorage.getItem('base44_access_token'))).toBeNull();
  void calls;
});
