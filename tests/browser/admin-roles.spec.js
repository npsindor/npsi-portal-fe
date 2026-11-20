import { expect, test } from '@playwright/test';
import { ADMIN, MEMBER, mockApi } from './mock-api.js';

// Dashboard charts, the admin menu search, Admin → Assign roles, and what a sub-admin (a member given admin work)
// can and cannot see.
const en = (page) => page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
const desktop = (page) => page.setViewportSize({ width: 1280, height: 900 });
const months = Array.from({ length: 12 }, (_, index) => `2026-${String(index + 1).padStart(2, '0')}`);
const CHARTS = {
  transactions: months.map((month, index) => ({ month, received: index * 1000, pending: 500, other: index === 5 ? 200 : 0, count: index })),
  transactionTypes: [{ name: 'Registration Fee', value: 12000, count: 24 }, { name: 'Event Registration', value: 4000, count: 16 }],
  transactionStatuses: [],
  users: months.map((month, index) => ({ month, count: index })),
  familyRegistrations: months.map((month) => ({ month, count: 2 })),
  studentRegistrations: months.map((month) => ({ month, count: 1 })),
  userTotals: { total: 120, active: 110, verified: 115, admins: 2 },
};
const SUB_ADMIN = { ...MEMBER, adminAccess: { superAdmin: false, areas: ['REGISTRATIONS', 'FAMILIES'], allVillages: false, villages: ['Rampura', 'Ghegaon'] } };

test('super admin dashboard: transactions, users / registrations and received-by-type charts', async ({ page }) => {
  await en(page);
  await desktop(page);
  await mockApi(page, { 'GET /auth/me': ADMIN, 'GET /admin-dashboard/charts': CHARTS });
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Transactions per month (₹)' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'New users and registrations per month' })).toBeVisible();
  await expect.poll(() => page.getByTestId('chart-transactions').locator('.recharts-bar-rectangle path').count()).toBeGreaterThan(10);
  await expect(page.getByTestId('chart-users').locator('.recharts-line')).toHaveCount(3);
  await expect(page.getByText('Registration Fee')).toBeVisible();
  await expect(page.getByText('120', { exact: true })).toBeVisible();
});

test('admin menu search filters the sidebar by label', async ({ page }) => {
  await en(page);
  await desktop(page);
  await mockApi(page, { 'GET /auth/me': ADMIN });
  await page.goto('/admin');
  const menu = page.locator('aside').getByRole('navigation', { name: 'Admin menu' });
  const search = page.locator('aside').getByRole('searchbox', { name: 'Search menu' });
  await search.fill('pay');
  await expect(menu.getByRole('link')).toHaveText(['Registration payments']);
  await search.fill('zzz');
  await expect(page.locator('aside').getByText('No menu item found.')).toBeVisible();
  await search.fill('');
  await expect(menu.getByRole('link', { name: 'Assign roles (sub-admins)' })).toBeVisible();
});

test('Assign roles: find a registered member, choose admin work and villages, save; remove again', async ({ page }) => {
  await en(page);
  await desktop(page);
  const saved = { userId: 'u-ram', name: 'Ram Patidar', email: 'ram@example.com', phone: '9876500001', familyId: 'NPSI-FAM-000024', village: 'Rampura', areas: ['REGISTRATIONS', 'FAMILIES'], allVillages: false, villages: ['Rampura'], active: true, note: null, grantedBy: 'Admin', updatedAt: '2026-11-19T10:00:00.000Z' };
  let list = [];
  const calls = await mockApi(page, {
    'GET /auth/me': ADMIN,
    'GET /admin-access/candidates': [
      { userId: 'u-ram', name: 'Ram Patidar', email: 'ram@example.com', phone: '9876500001', familyId: 'NPSI-FAM-000024', village: 'Rampura', eligible: true, hasAccess: false },
      { userId: 'u-x', name: 'Ramesh Guest', email: 'guest@example.com', phone: null, familyId: null, village: null, eligible: false, hasAccess: false },
    ],
    'PUT /admin-access/u-ram': saved,
    'DELETE /admin-access/u-ram': { status: 204, body: null },
  });
  await page.route('**/api/v1/admin-access', (route) => route.fulfill({ json: list }));
  await page.goto('/admin/roles');
  await expect(page.getByRole('heading', { level: 1, name: 'Assign roles (sub-admins)' })).toBeVisible();
  await expect(page.getByText('No sub-admins yet.')).toBeVisible();
  await page.getByRole('button', { name: 'Give admin access' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Find the member (name, email or mobile)').fill('Ram');
  await expect(dialog.getByText('Not a registered family member')).toBeVisible();
  await dialog.getByRole('button', { name: 'Choose' }).click();
  await dialog.getByRole('checkbox', { name: /Family registration approval/ }).check();
  await dialog.getByRole('checkbox', { name: /Student registration approval/ }).check();
  await dialog.getByRole('checkbox', { name: /Families & new member approval/ }).check();
  await dialog.getByRole('button', { name: 'Save access' }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Choose the villages, or all villages.');
  await dialog.getByPlaceholder('Search villages…').fill('Rampura');
  await dialog.getByRole('checkbox', { name: /^Rampura/ }).check();
  await dialog.getByRole('button', { name: 'Save access' }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Student registration approval needs “All villages”.');
  await dialog.getByRole('checkbox', { name: /Student registration approval/ }).uncheck();
  list = [saved];
  await dialog.getByRole('button', { name: 'Save access' }).click();
  await expect.poll(() => calls.find((call) => call.key === 'PUT /admin-access/u-ram')?.body).toEqual({ areas: ['REGISTRATIONS', 'FAMILIES'], allVillages: false, villages: ['Rampura'], active: true });
  const row = page.getByRole('row', { name: /Ram Patidar/ });
  await expect(row).toContainText('Family registration approval');
  await expect(row).toContainText('Rampura');
  await row.getByRole('button', { name: 'Remove' }).click();
  list = [];
  await page.getByRole('button', { name: 'Remove access' }).click();
  await expect.poll(() => calls.some((call) => call.key === 'DELETE /admin-access/u-ram')).toBe(true);
});

test('a sub-admin opens the admin panel from the member portal and sees only their work, read + approve', async ({ page }) => {
  await en(page);
  await desktop(page);
  await mockApi(page, {
    'GET /auth/me': SUB_ADMIN,
    'GET /me/family': { family: null, members: [] },
    'GET /applications': [{ id: 'a1', applicationId: 'NPSI-APP-2026-000001', familyHeadName: 'Kamal Patidar', familyName: 'Patidar', village: 'Rampura', status: 'PENDING_VERIFICATION', mobile: '9000000001', submittedDate: '2026-11-18T00:00:00.000Z' }],
  });
  await page.goto('/portal');
  await page.getByRole('link', { name: 'Admin panel' }).first().click();
  await expect(page).toHaveURL(/\/admin\/applications$/);
  const menu = page.locator('aside').getByRole('navigation', { name: 'Admin menu' });
  await expect(menu.getByRole('link')).toHaveText(['Registrations', 'Families']);
  await expect(page.getByRole('note')).toContainText('Family registration approval, Families & new member approval');
  await expect(page.getByRole('note')).toContainText('Rampura, Ghegaon');
  await expect(page.getByText('Sub-admin', { exact: true })).toBeVisible();
  await expect(page.getByText('NPSI-APP-2026-000001')).toBeVisible();
  await expect(page.getByRole('button', { name: /Add/ })).toHaveCount(0);
  // A page outside their work sends them back to it.
  await page.goto('/admin/events');
  await expect(page).toHaveURL(/\/admin\/applications$/);
  await expect(page.locator('html')).toHaveClass(/admin-theme/);
});

test('an ordinary member gets no admin panel', async ({ page }) => {
  await en(page);
  await desktop(page);
  await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /me/family': { family: null, members: [] } });
  await page.goto('/portal');
  await expect(page.getByRole('link', { name: 'Admin panel' })).toHaveCount(0);
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/portal$/);
});
