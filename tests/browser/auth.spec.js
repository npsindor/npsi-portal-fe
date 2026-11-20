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
  // Logged out until the email code is verified, like the real signup (the session cookie comes with the verification).
  let verified = false;
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
  await page.route('**/api/v1/auth/otp-verifications', (route) => {
    verified = true;
    return route.fulfill({ json: { user: MEMBER, accessToken: 'a'.repeat(64) }, headers: { 'Set-Cookie': 'npsi_session=x; Path=/; HttpOnly; SameSite=Strict' } });
  });
  await page.route('**/api/v1/auth/me', (route) => (verified ? route.fulfill({ json: MEMBER }) : route.fulfill({ status: 401, json: { error: 'Authentication required.' } })));
  await page.goto('/register-account');
  await page.locator('#otp-mobile').fill('9926877375');
  await page.locator('#otp-email').fill('new-member@example.test');
  await page.getByRole('button', { name: 'Send code' }).click();
  await expect(page.getByRole('status').filter({ hasText: /use an email verification code/i })).toBeVisible();
  await page.locator('#reg-name').fill('New Test Member');
  await page.locator('#reg-password').fill('Secret123');
  await page.locator('#reg-confirm').fill('Secret123');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'We sent a verification code to new-member@example.test' })).toBeVisible();
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
  await page.getByRole('tab', { name: 'Using mobile' }).click(); // email is the first tab
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
  await page.getByRole('tab', { name: 'Using mobile' }).click(); // email is the first tab
  await page.locator('#otp-mobile').fill('9926877375');
  await page.getByRole('button', { name: 'Send code' }).click();
  await expect(page.getByRole('alert')).toContainText('The login service could not be reached');
});

test('password reset falls back to email when the deployed API lacks mobile OTP routes', async ({ page }) => {
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  await page.route('**/api/v1/auth/mobile-otps', (route) => route.fulfill({ status: 404, json: { error: 'Cannot POST /api/v1/auth/mobile-otps' } }));
  await page.goto('/forgot-password');
  await page.getByRole('tab', { name: 'Using mobile' }).click(); // email is the first tab
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

// Family Member Login vs Student Login: the page sends the chosen portal and follows the server's decision.
const FAMILY_MSG = 'Your account is registered as an NPS Family Member. Please use Family Member Login to access your account.';
const loginWith = async (page, answer) => {
  const sent = [];
  let me = null;
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  await mockApi(page);
  await page.route('**/api/v1/auth/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/auth/sessions') && route.request().method() === 'POST') {
      const body = JSON.parse(route.request().postData());
      sent.push(body);
      const reply = answer(body);
      if (reply.status === 200) me = { ...reply.json.user, account: reply.json.account };
      return route.fulfill(reply);
    }
    if (path.endsWith('/auth/me')) return route.fulfill(me ? { json: me } : { status: 401, json: { error: 'Authentication required.' } });
    return route.fallback();
  });
  return sent;
};
const submit = async (page) => {
  await page.fill('#email', 'member@example.com');
  await page.fill('#password', 'Secret@123');
  await page.locator('form button[type="submit"]').click();
};

test('Student Login sends the STUDENT portal; a Family Member account is refused and offered Family Member Login', async ({ page }) => {
  const sent = await loginWith(page, (body) =>
    body.portal === 'STUDENT'
      ? { status: 403, json: { error: FAMILY_MSG } }
      : { status: 200, json: { user: MEMBER, accessToken: 'a'.repeat(64), account: { type: 'FAMILY', status: 'ACTIVE' } } },
  );
  await page.goto('/login?portal=student');
  await expect(page.getByRole('heading', { name: 'Student Login' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Student Login' })).toHaveAttribute('aria-pressed', 'true');
  await submit(page);
  await expect(page.getByRole('alert')).toContainText(FAMILY_MSG);
  await expect(page.locator('#login-code')).toHaveCount(0);
  await page.getByRole('button', { name: 'Go to Family Member Login' }).click();
  await expect(page.getByRole('button', { name: 'Family Member Login' })).toHaveAttribute('aria-pressed', 'true');
  await submit(page);
  await expect(page).toHaveURL(/\/portal$/);
  expect(sent.map((body) => body.portal)).toEqual(['STUDENT', 'FAMILY']);
});

test('a Student account lands on its dashboard and family pages are closed to it', async ({ page }) => {
  await loginWith(page, () => ({ status: 200, json: { user: MEMBER, accessToken: 'a'.repeat(64), account: { type: 'STUDENT', status: 'ACTIVE' } } }));
  await page.goto('/login?portal=student&returnTo=%2Fportal%2Ffamily');
  await submit(page);
  await expect(page).toHaveURL(/\/portal$/);
  await expect(page.locator('a[href="/portal/family"]')).toHaveCount(0);
  await page.goto('/portal/event-kharcha');
  await expect(page).toHaveURL(/\/portal$/);
});

test('Hindi: the portal refusal is shown in Hindi', async ({ page }) => {
  await loginWith(page, () => ({ status: 403, json: { error: FAMILY_MSG } }));
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'hi'));
  await page.goto('/login?portal=student');
  await submit(page);
  await expect(page.getByRole('alert')).toContainText('परिवार सदस्य लॉगिन का उपयोग करें');
  await expect(page.getByRole('button', { name: 'परिवार सदस्य लॉगिन पर जाएँ' })).toBeVisible();
});

test('login, password reset by email and by mobile send a reCAPTCHA token', async ({ page }) => {
  const sent = {};
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  for (const [key, glob, reply] of [
    ['login', '**/api/v1/auth/sessions', { status: 401, json: { error: 'Invalid email or password.' } }],
    ['reset', '**/api/v1/auth/password-resets', { json: { ok: true } }],
    ['mobile', '**/api/v1/auth/mobile-otps', { json: { ok: true, channel: 'WHATSAPP', expiresInSeconds: 600 } }],
  ]) await page.route(glob, (route) => { sent[key] = route.request().postDataJSON(); return route.fulfill(reply); });
  await page.goto('/login');
  await page.fill('#email', 'member@example.com');
  await page.fill('#password', 'Secret@123');
  await page.locator('form button[type="submit"]').click();
  await expect.poll(() => sent.login?.recaptchaToken).toBe('test-recaptcha-token');
  await page.goto('/forgot-password');
  await page.getByRole('tab', { name: 'Using mobile' }).click(); // email is the first tab
  await page.locator('#otp-mobile').fill('9926877375');
  await page.getByRole('button', { name: 'Send code' }).click();
  await expect.poll(() => sent.mobile).toMatchObject({ mobile: '9926877375', purpose: 'RESET', recaptchaToken: 'test-recaptcha-token' });
  await page.getByRole('tab', { name: 'Using email' }).click();
  await page.locator('#fp-email').fill('member@example.com');
  await page.locator('#fp-email').press('Enter');
  await expect.poll(() => sent.reset).toEqual({ email: 'member@example.com', recaptchaToken: 'test-recaptcha-token' });
});

test('the session check uses GET /auth/sessions/current: a visitor gets no 401 in the console, a member is logged in', async ({ page }) => {
  // Checks the desktop sidebar / header links (on phones they sit in the menu).
  await page.setViewportSize({ width: 1280, height: 900 });
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  const calls = await mockApi(page, { 'GET /auth/sessions/current': { user: null } });
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Member Login' }).first()).toBeVisible();
  expect(calls.some((call) => call.key === 'GET /auth/me')).toBe(false);
  expect(errors.filter((text) => /401|Unauthorized/.test(text))).toEqual([]);
  const member = await page.context().newPage();
  await mockApi(member, { 'GET /auth/sessions/current': { user: MEMBER } });
  await member.goto('/portal');
  await expect(member).toHaveURL(/\/portal$/);
});

test('forgot password: "Using email" is the first tab and is selected, "Using mobile" comes second', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  await page.goto('/forgot-password');
  await expect(page.getByRole('tab')).toHaveText(['Using email', 'Using mobile']);
  await expect(page.getByRole('tab', { name: 'Using email' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#fp-email')).toBeVisible();
});
