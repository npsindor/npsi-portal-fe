import { expect, test } from '@playwright/test';
import { ADMIN, MEMBER, mockApi } from './mock-api.js';

// The portal side of the security fixes (open issues list, Nov 2026): members a head adds wait for an admin,
// one open transfer request per member, the administrator's emailed sign-in code, and reset tokens kept out of URLs.
const FAMILY = { id: 'f-1', familyId: 'NPSI-FAM-000024', familyName: 'Patidar Parivar', headName: 'Ram Patidar', status: 'ACTIVE', memberCount: 2, email: 'ram@example.com' };
const HEAD = { id: 'm-1', familyId: FAMILY.familyId, membershipId: 'NPSI-MEM-000001', name: 'Ram Patidar', relationship: 'Head', status: 'ACTIVE' };
const NEW_MEMBER = { id: 'm-2', familyId: FAMILY.familyId, membershipId: 'NPSI-MEM-000055', name: 'Kid Patidar', relationship: 'Son', status: 'PENDING' };

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
});

test('my family: a new member is sent without a status and is shown as waiting for admin approval', async ({ page }) => {
  const calls = await mockApi(page, {
    'GET /auth/me': MEMBER,
    'GET /me/family': { family: FAMILY, members: [HEAD, NEW_MEMBER], student: null },
    'POST /family-members': { status: 201, body: { ...NEW_MEMBER, id: 'm-3', name: 'Asha Patidar', relationship: 'Daughter' } },
  });
  await page.goto('/portal/family');
  await expect(page.getByText("Waiting for admin approval. Until then this member can't be registered for events or Shagun Bandhan.")).toHaveCount(1);
  await page.getByRole('button', { name: 'Add Member' }).first().click();
  await page.getByPlaceholder('Full name').fill('Asha Patidar');
  await page.locator('select').filter({ has: page.locator('option', { hasText: 'Daughter' }) }).first().selectOption({ label: 'Daughter' });
  await page.getByRole('button', { name: 'Add Member' }).last().click();
  await expect.poll(() => calls.find((call) => call.key === 'POST /family-members')?.body).toBeTruthy();
  const sent = calls.find((call) => call.key === 'POST /family-members').body;
  expect(sent.status).toBeUndefined();
});

test('my family: with an undecided transfer request the member shows it instead of offering another one', async ({ page }) => {
  await mockApi(page, {
    'GET /auth/me': MEMBER,
    'GET /me/family': { family: FAMILY, members: [HEAD], student: null },
    'GET /me/transfer-requests': [{ requestId: 'TRF-000007', requestType: 'family_to_family', status: 'PENDING', sourceMembershipId: HEAD.membershipId, sourceStudentId: null, targetFamilyId: 'NPSI-FAM-000002', createdAt: '2026-11-18T10:00:00.000Z' }],
  });
  await page.goto('/portal/family');
  await expect(page.getByRole('status').filter({ hasText: 'Transfer request pending (TRF-000007)' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Transfer to another family' })).toHaveCount(0);
});

test('transfer request: only the member, target and reason are sent; the server decides requester and source', async ({ page }) => {
  const calls = await mockApi(page, {
    'GET /auth/me': MEMBER,
    'GET /me/family': { family: FAMILY, members: [HEAD], student: null },
    'GET /family-verifications/NPSI-FAM-000002': { family: { familyId: 'NPSI-FAM-000002', familyName: 'Joshi Parivar', status: 'ACTIVE' } },
    'POST /transfer-requests': { status: 201, body: { id: 't-1', requestId: 'TRF-000008', status: 'PENDING', sourceMembershipId: HEAD.membershipId } },
  });
  await page.goto('/portal/family');
  await page.getByRole('button', { name: 'Transfer to another family' }).click();
  await page.getByPlaceholder('NPSI-FAM-000001').fill('NPSI-FAM-000002');
  await page.getByRole('button', { name: 'Submit Request' }).click();
  await expect.poll(() => calls.find((call) => call.key === 'POST /transfer-requests')?.body).toBeTruthy();
  const sent = calls.find((call) => call.key === 'POST /transfer-requests').body;
  expect(Object.keys(sent).sort()).toEqual(['lang', 'reason', 'requestType', 'sourceMembershipId', 'targetFamilyId', 'targetFamilyName']);
  expect(sent.sourceMembershipId).toBe(HEAD.membershipId);
  // Now pending: the button gives way to the request's reference.
  await expect(page.getByRole('status').filter({ hasText: 'Transfer request pending (TRF-000008)' })).toBeVisible();
});

test('admin: a pending member is approved from the family view', async ({ page }) => {
  const calls = await mockApi(page, {
    'GET /auth/me': ADMIN,
    'GET /families': [FAMILY],
    'GET /family-members': [HEAD, { ...NEW_MEMBER, email: 'kid@example.com' }],
    // Wrapped: a body with its own `status` field would be read as the HTTP status.
    'PATCH /family-members/m-2': { status: 200, body: { ...NEW_MEMBER, status: 'ACTIVE' } },
  });
  await page.goto('/admin/families');
  await page.getByRole('row', { name: /Patidar Parivar/ }).getByRole('button').first().click();
  await expect(page.getByText('1 added by the family head, waiting for approval')).toBeVisible();
  await expect(page.getByText('kid@example.com')).toBeVisible();
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  await expect.poll(() => calls.find((call) => call.key === 'PATCH /family-members/m-2')?.body).toEqual({ status: 'ACTIVE' });
  await expect(page.getByRole('button', { name: 'Approve', exact: true })).toHaveCount(0);
});

test('admin login: the password step asks for the emailed code, which finishes the sign-in (mobile login too)', async ({ page }) => {
  let me = null;
  const sent = [];
  await mockApi(page);
  await page.route('**/api/v1/auth/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path.endsWith('/auth/sessions') && request.method() === 'POST')
      return route.fulfill({ status: 403, json: { error: 'Enter the sign-in code sent to your email to finish logging in.' } });
    if (path.endsWith('/auth/otp-verifications')) {
      sent.push(JSON.parse(request.postData()));
      me = { ...ADMIN, account: { type: 'ADMIN', status: 'ACTIVE' } };
      return route.fulfill({ json: { user: ADMIN, account: { type: 'ADMIN', status: 'ACTIVE' } } });
    }
    if (path.endsWith('/auth/me')) return route.fulfill(me ? { json: me } : { status: 401, json: { error: 'Authentication required.' } });
    return route.fallback();
  });
  await page.goto('/login');
  await page.fill('#email', '+91 98765 43210');
  await page.fill('#password', 'Garba#2026');
  await page.locator('form button[type="submit"]').last().click();
  await expect(page.getByRole('alert')).toContainText('Enter the sign-in code sent to your email');
  await page.fill('#login-code', '123456');
  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page).toHaveURL(/\/admin$/);
  expect(sent[0]).toMatchObject({ email: '9876543210', otpCode: '123456', recaptchaToken: 'test-recaptcha-token' });
});

test('reset link: the token travels after "#", is used for the reset and is removed from the address bar', async ({ page }) => {
  const calls = await mockApi(page, { 'GET /auth/me': { status: 401, body: { error: 'Authentication required.' } }, 'POST /password-resets/confirmations': { ok: true } });
  await page.goto('/reset-password#token=abc123');
  await expect.poll(() => page.evaluate(() => window.location.href)).not.toContain('abc123');
  await page.locator('input[name="password"]').fill('Garba#2026');
  await page.locator('input[name="confirm"]').fill('Garba#2026');
  await page.locator('form button[type="submit"]').click();
  await expect.poll(() => calls.find((call) => /password-resets\/confirmations$/.test(call.key))?.body?.resetToken).toBe('abc123');
});
