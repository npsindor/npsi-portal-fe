// Security checks against a running API (no mocks): nothing private opens without a login,
// public answers carry no personal data, one family can't read or change another's records,
// and the server's own defences (CORS, headers, input handling) hold.
//
//   npm run test:security                                   # API at http://localhost:4000
//   API_URL=https://api.npsindore.org npm run test:security # any deployed API (read-only checks)
//
// Logged-in checks run when these are set (use test accounts, never real members):
//   MEMBER_LOGIN / MEMBER_PASSWORD   a member who belongs to a family
//   OTHER_FAMILY_MEMBER_ID           id (uuid) of a member row in a DIFFERENT family
//   OTHER_FAMILY_ID                  display id (NPSI-FAM-…) of that other family
// Rate-limit checks lock the test IP out of logins for 15 minutes, so they only run with RUN_RATE_LIMIT=1.
import { expect, test } from '@playwright/test';

const API = (process.env.API_URL || 'http://localhost:4000').replace(/\/$/, '');
const V1 = `${API}/api/v1`;
const AUTH_REQUIRED = 'Authentication required.';

// Admin-only reads: every one must refuse anonymous visitors and members.
const ADMIN_GETS = [
  'families', 'family-members', 'applications', 'student-applications', 'students', 'transactions', 'samitis',
  'samiti-members', 'feedback', 'event-registrations', 'contact-info', 'transfer-requests', 'registration-payments',
  'address-options/all', 'event-finance/members', 'event-finance/admin/categories', 'sagun/admin', 'sagun/admin/stats',
  'sagun/admin/profiles', 'sagun/admin/settings', 'sehat-saathi/admin',
];
// Member-only reads: a login is required.
const MEMBER_GETS = [
  'auth/me', 'me/family', 'me/feedback', 'me/event-registrations', 'me/registrations', 'me/profile-completion', 'notifications',
  'event-finance', 'safar-saathi/me', 'sagun/me', 'sagun/profiles', 'sagun/eligible-members', 'sehat-saathi/me',
  'family-verifications/NPSI-FAM-000001',
];
// Writes that change data: anonymous calls must be refused before anything happens.
const ANONYMOUS_WRITES = [
  ['post', 'families'], ['patch', 'families/x'], ['delete', 'families/x'], ['post', 'family-members'], ['patch', 'family-members/x'],
  ['delete', 'family-members/x'], ['post', 'family-members/batch'], ['post', 'notifications'], ['post', 'transactions'],
  ['post', 'events'], ['post', 'announcements'], ['post', 'applications/x/review'], ['post', 'auth/invitations'], ['put', 'auth/password'],
];
// Public reads (the website without a login).
const PUBLIC_GETS = [
  'health', 'stats', 'events', 'announcements', 'home-highlights', 'page-blocks', 'community-posts', 'principles', 'rules',
  'address-options', 'sehat-saathi/public', 'safar-saathi/capabilities', 'sagun/schema',
];
// Keys that must never appear in a public answer.
const PRIVATE_KEYS = /^(mobile|phone|email|address|dob|passwordHash|password|sessionToken|token|otpHash|resetTokenHash|aadhaar|paymentReference|contactNumber|mobileDigits|contactDigits)$/i;
// Sehat Saathi publishes the phone numbers of consenting medical representatives on purpose.
const PUBLIC_CONTACT_ALLOWED = new Set(['sehat-saathi/public']);

const privateKeysIn = (value, path = '$', found = []) => {
  if (Array.isArray(value)) value.forEach((item, index) => privateKeysIn(item, `${path}[${index}]`, found));
  else if (value && typeof value === 'object')
    for (const [key, child] of Object.entries(value)) {
      // Only real values count: `{ email: true }` (a feature flag) is not an email address.
      if (PRIVATE_KEYS.test(key) && ((typeof child === 'string' && child !== '') || typeof child === 'number')) found.push(`${path}.${key}`);
      privateKeysIn(child, `${path}.${key}`, found);
    }
  return found;
};

test.beforeAll(async ({ request }) => {
  const res = await request.get(`${V1}/health`).catch(() => null);
  test.skip(!res?.ok(), `API not reachable at ${API}; start the backend (npm run start:dev) or set API_URL.`);
});

test.describe('nothing private opens without a login', () => {
  for (const path of [...ADMIN_GETS, ...MEMBER_GETS])
    test(`GET /${path} → 401`, async ({ request }) => {
      const res = await request.get(`${V1}/${path}`);
      expect(res.status()).toBe(401);
      expect(await res.json()).toEqual({ error: AUTH_REQUIRED });
    });

  for (const [method, path] of ANONYMOUS_WRITES)
    test(`${method.toUpperCase()} /${path} → 401`, async ({ request }) => {
      const res = await request[method](`${V1}/${path}`, { data: {} });
      expect(res.status()).toBe(401);
    });

  test('a made-up bearer token or cookie is refused', async ({ request }) => {
    for (const headers of [{ Authorization: `Bearer ${'a'.repeat(64)}` }, { Authorization: 'Bearer x' }, { Cookie: `npsi_session=${'b'.repeat(64)}` }]) {
      const res = await request.get(`${V1}/auth/me`, { headers });
      expect(res.status(), JSON.stringify(headers)).toBe(401);
    }
  });
});

test.describe('public answers carry no personal data', () => {
  for (const path of PUBLIC_GETS)
    test(`GET /${path}`, async ({ request }) => {
      const res = await request.get(`${V1}/${path}`);
      expect(res.status()).toBe(200);
      const found = privateKeysIn(await res.json());
      if (PUBLIC_CONTACT_ALLOWED.has(path)) return;
      expect(found, `private fields in a public answer: ${found.join(', ')}`).toEqual([]);
    });

  test('availability checks answer only taken: true/false', async ({ request }) => {
    for (const path of ['mobile-availability?mobile=9999999999', 'email-availability?email=nobody@example.com']) {
      const body = await (await request.get(`${V1}/${path}`)).json();
      expect(Object.keys(body)).toEqual(['taken']);
    }
  });

  test('application tracking needs the id and the matching mobile', async ({ request }) => {
    expect((await request.get(`${V1}/application-status`)).status()).toBe(400);
    expect((await request.get(`${V1}/application-status?applicationId=NPSI-APP-2026-000001&mobile=0000000000`)).status()).toBe(404);
  });
});

test.describe('server defences', () => {
  test('security headers are set and the framework is not advertised', async ({ request }) => {
    const headers = (await request.get(`${V1}/health`)).headers();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBeTruthy();
    expect(headers['strict-transport-security']).toContain('max-age=');
    expect(headers['x-powered-by']).toBeUndefined();
  });

  test('CORS: other websites cannot call the API with a member’s session', async ({ request }) => {
    const evil = await request.get(`${V1}/health`, { headers: { Origin: 'https://evil.example.com' } });
    expect(evil.headers()['access-control-allow-origin']).toBeUndefined();
    const lookalike = await request.get(`${V1}/health`, { headers: { Origin: 'https://npsindore.org.evil.com' } });
    expect(lookalike.headers()['access-control-allow-origin']).toBeUndefined();
    const own = await request.get(`${V1}/health`, { headers: { Origin: 'https://npsindore.org' } });
    expect(own.headers()['access-control-allow-origin']).toBe('https://npsindore.org');
  });

  test('uploads: no directory listing, no path traversal, no server files', async ({ request }) => {
    for (const path of ['/uploads/', '/uploads/..%2f.env', '/uploads/%2e%2e/%2e%2e/.env', '/uploads/../package.json', '/.env', '/.git/config']) {
      const res = await request.get(`${API}${path}`);
      expect(res.status(), path).not.toBe(200);
      expect(await res.text(), path).not.toMatch(/MYSQL_PASSWORD|SMTP_PASS|\[core\]|"dependencies"/);
    }
  });

  test('anonymous uploads accept images only', async ({ request }) => {
    const res = await request.post(`${V1}/uploads`, {
      multipart: { file: { name: 'shell.php', mimeType: 'image/png', buffer: Buffer.from('<?php system($_GET["c"]); ?>') } },
    });
    expect(res.status()).toBe(400);
  });

  test('injection-looking input is handled, never a server error or a stack trace', async ({ request }) => {
    const probes = [
      `application-status?applicationId=${encodeURIComponent("' OR '1'='1")}&mobile=${encodeURIComponent("1' OR 1=1 --")}`,
      `mobile-availability?mobile=${encodeURIComponent("'; DROP TABLE users; --")}`,
      `email-availability?email=${encodeURIComponent('a@b.c" OR ""="')}`,
      `events?order=${encodeURIComponent('id; DROP TABLE events')}`,
    ];
    for (const path of probes) {
      const res = await request.get(`${V1}/${path}`);
      expect(res.status(), path).toBeLessThan(500);
      expect(await res.text(), path).not.toMatch(/at .+\.(js|ts):\d+|Prisma|SQL syntax|stack/i);
    }
    const login = await request.post(`${V1}/auth/sessions`, { data: { email: { $ne: null }, password: { $ne: null } } });
    expect([400, 401]).toContain(login.status());
  });

  test('oversized and malformed bodies are rejected cleanly', async ({ request }) => {
    const big = await request.post(`${V1}/auth/sessions`, { data: { email: 'x'.repeat(3 * 1024 * 1024), password: 'x' } });
    expect(big.status()).toBe(413);
    const bad = await request.post(`${V1}/auth/sessions`, { headers: { 'Content-Type': 'application/json' }, data: '{bad' });
    expect(bad.status()).toBe(400);
    expect(Object.keys(await bad.json())).toEqual(['error']);
  });

  test('login does not say whether an account exists', async ({ request }) => {
    const unknown = await request.post(`${V1}/auth/sessions`, { data: { email: 'nobody-here@example.com', password: 'Wrong-pass-1' } });
    expect(unknown.status()).toBe(401);
    expect(await unknown.json()).toEqual({ error: 'Invalid email/phone or password.' });
  });

  test('API docs are hidden on deployed servers', async ({ request }) => {
    const { env } = await (await request.get(`${V1}/health`)).json();
    test.skip(!['production', 'test'].includes(env), `APP_ENV=${env}: docs are allowed on a developer machine`);
    expect((await request.get(`${API}/api/docs`)).status()).toBe(404);
    expect((await request.get(`${API}/api/docs-json`)).status()).toBe(404);
  });
});

test.describe('a member sees and changes only their own family', () => {
  const { MEMBER_LOGIN, MEMBER_PASSWORD, OTHER_FAMILY_MEMBER_ID, OTHER_FAMILY_ID } = process.env;
  let auth;

  test.beforeAll(async ({ request }) => {
    test.skip(!MEMBER_LOGIN || !MEMBER_PASSWORD, 'set MEMBER_LOGIN and MEMBER_PASSWORD (a test member) to run these');
    const res = await request.post(`${V1}/auth/sessions`, { data: { email: MEMBER_LOGIN, password: MEMBER_PASSWORD } });
    expect(res.status(), 'test member login').toBe(200);
    const body = await res.json();
    expect(body.user.role, 'MEMBER_LOGIN must be a normal member, not an admin').not.toBe('admin');
    auth = { Authorization: `Bearer ${body.accessToken}` };
    // The session cookie is httpOnly and SameSite=Strict, so page scripts and other sites can't use it.
    const cookie = res.headers()['set-cookie'] || '';
    expect(cookie).toMatch(/npsi_session=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
  });

  for (const path of ADMIN_GETS)
    test(`member GET /${path} → 403`, async ({ request }) => {
      const res = await request.get(`${V1}/${path}`, { headers: auth });
      expect(res.status()).toBe(403);
    });

  test('my family shows only my own family', async ({ request }) => {
    const body = await (await request.get(`${V1}/me/family`, { headers: auth })).json();
    const familyId = body.family?.familyId;
    expect(familyId).toBeTruthy();
    for (const member of body.members || []) expect(member.familyId).toBe(familyId);
    if (OTHER_FAMILY_ID) expect(JSON.stringify(body)).not.toContain(OTHER_FAMILY_ID);
  });

  test("another family's member can't be edited or deleted", async ({ request }) => {
    test.skip(!OTHER_FAMILY_MEMBER_ID, 'set OTHER_FAMILY_MEMBER_ID to run');
    const patch = await request.patch(`${V1}/family-members/${OTHER_FAMILY_MEMBER_ID}`, { headers: auth, data: { name: 'Hacked' } });
    expect(patch.status()).toBe(403);
    const del = await request.delete(`${V1}/family-members/${OTHER_FAMILY_MEMBER_ID}`, { headers: auth });
    expect(del.status()).toBe(403);
  });

  test("a member can't add people to another family or slip in admin fields", async ({ request }) => {
    test.skip(!OTHER_FAMILY_ID, 'set OTHER_FAMILY_ID to run');
    const res = await request.post(`${V1}/family-members`, { headers: auth, data: { familyId: OTHER_FAMILY_ID, name: 'Intruder' } });
    expect(res.status()).toBe(403);
  });

  test('a member cannot promote themselves to admin', async ({ request }) => {
    await request.patch(`${V1}/auth/me`, { headers: auth, data: { role: 'admin', isVerified: true } });
    const me = await (await request.get(`${V1}/auth/me`, { headers: auth })).json();
    expect(me.role).not.toBe('admin');
  });

  test("event kharcha never shows other families' ids, payment references or full mobiles", async ({ request }) => {
    const events = await (await request.get(`${V1}/event-finance`, { headers: auth })).json();
    test.skip(!events.length, 'no published events to check');
    for (const event of events.slice(0, 5)) {
      const detail = await (await request.get(`${V1}/event-finance/${event.id}`, { headers: auth })).json();
      for (const row of detail.contributions || []) {
        expect(row.paymentReference).toBeUndefined();
        expect(row.memberId).toBeUndefined();
        expect(row.familyId).toBeUndefined();
        if (row.mobile) expect(row.mobile).toMatch(/^\*+\d{4}$/);
      }
    }
  });

  test("another member's payment screenshot is not readable", async ({ request }) => {
    const res = await request.get(`${V1}/registration-payments/00000000-0000-0000-0000-000000000000/screenshot`, { headers: auth });
    expect([403, 404]).toContain(res.status());
  });
});

test.describe('brute force is slowed down', () => {
  test.skip(process.env.RUN_RATE_LIMIT !== '1', 'set RUN_RATE_LIMIT=1 (locks this IP out of logins for 15 minutes)');
  test('repeated wrong logins hit the rate limit', async ({ request }) => {
    let status = 0;
    for (let i = 0; i < 25 && status !== 429; i += 1)
      status = (await request.post(`${V1}/auth/sessions`, { data: { email: 'nobody-here@example.com', password: `wrong-${i}` } })).status();
    expect(status).toBe(429);
  });
});
