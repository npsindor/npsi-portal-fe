import { expect, test } from '@playwright/test';
import { ADMIN, MEMBER, mockApi, NOT_LOGGED_IN } from './mock-api.js';

// The super admin's own colours, the homepage "Blood Donor" service, page / section visibility, and admin forms that
// fill in a person already registered on the portal.
const daysAhead = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const en = (page) => page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
const desktop = (page) => page.setViewportSize({ width: 1280, height: 900 });
const background = (locator) => locator.evaluate((element) => getComputedStyle(element).backgroundColor);
const KAMAL = { kind: 'MEMBER', id: 'm-9', name: 'Kamal Patidar', village: 'Rampura', mobile: '9876500009', email: 'kamal@example.com', photoUrl: '/uploads/kamal.png', familyId: 'NPSI-FAM-000009', membershipId: 'NPSI-MEM-000090', studentId: null };

test('the super admin portal has its own colours; the member portal and the website keep theirs', async ({ page }) => {
  await en(page);
  await desktop(page);
  await mockApi(page, { 'GET /auth/me': ADMIN });
  await page.goto('/admin');
  await expect(page.locator('html')).toHaveClass(/admin-theme/);
  const adminSidebar = await background(page.locator('aside').first());
  expect(adminSidebar).toBe('rgb(59, 7, 100)');
  await page.getByRole('link', { name: 'Back to Website' }).first().click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('html')).not.toHaveClass(/admin-theme/);
  expect(await background(page.locator('#public-navigation'))).toBe('rgb(16, 42, 67)');
});

test('member portal keeps the website colours (no admin theme)', async ({ page }) => {
  await en(page);
  await desktop(page);
  await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /me/family': { family: null, members: [] } });
  await page.goto('/portal');
  await expect(page.locator('html')).not.toHaveClass(/admin-theme/);
});

test('homepage first section: "Blood Donor" is one of the services and opens its page', async ({ page }) => {
  await en(page);
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  await page.goto('/');
  const card = page.locator('#services').getByRole('link', { name: /Blood Donor/ });
  await expect(card).toBeVisible();
  await card.click();
  await expect(page).toHaveURL(/\/community-services$/);
});

test('a page an admin switched off leaves the menu, footer, homepage and search; its link says "not available"', async ({ page }) => {
  await en(page);
  await desktop(page);
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /site-visibility': { hidden: ['page:/transportation', 'page:/core-team', 'section:home.gallery', 'section:home.updates'] } });
  await page.goto('/');
  const nav = page.locator('#public-navigation');
  await nav.locator('summary', { hasText: 'Services' }).click();
  await expect(nav.getByRole('link', { name: 'Room Hunting', exact: true })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Transportation', exact: true })).toHaveCount(0);
  await expect(page.locator('#services').getByRole('link', { name: /Transportation/ })).toHaveCount(0);
  await expect(page.locator('footer').getByRole('link', { name: 'Transportation' })).toHaveCount(0);
  await expect(page.locator('footer').getByRole('link', { name: 'Core Team' })).toHaveCount(0);
  await expect(page.locator('#updates')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /Photo Gallery/i })).toHaveCount(0);
  await expect(page.locator('#events')).toHaveCount(1);
  await page.goto('/transportation');
  await expect(page.getByRole('heading', { level: 1, name: 'This page is not available right now' })).toBeVisible();
  await page.goto('/core-team');
  await expect(page.getByRole('heading', { level: 1, name: 'This page is not available right now' })).toBeVisible();
});

test('Hindi: the "not available" page is in Hindi', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'hi'));
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /site-visibility': { hidden: ['page:/help'] } });
  await page.goto('/help');
  await expect(page.getByRole('heading', { level: 1, name: 'यह पेज अभी उपलब्ध नहीं है' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'होमपेज पर जाएँ' })).toBeVisible();
});

test('an admin still sees a switched-off page, with a notice', async ({ page }) => {
  await en(page);
  await mockApi(page, { 'GET /auth/me': ADMIN, 'GET /site-visibility': { hidden: ['page:/help'] } });
  await page.goto('/help');
  await expect(page.getByRole('status').filter({ hasText: 'Hidden from the public' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'This page is not available right now' })).toHaveCount(0);
});

test('admin: Page visibility switches pages and sections and saves only the changes', async ({ page }) => {
  await en(page);
  await desktop(page);
  const calls = await mockApi(page, {
    'GET /auth/me': ADMIN,
    'GET /site-visibility': { hidden: ['page:/help'] },
    'PUT /site-visibility': { hidden: ['page:/transportation', 'section:home.gallery'] },
  });
  await page.goto('/admin');
  await page.getByRole('link', { name: 'Page visibility (on / off)' }).first().click();
  await expect(page).toHaveURL(/\/admin\/site-visibility$/);
  await expect(page.getByRole('switch', { name: 'Help' })).toHaveAttribute('aria-checked', 'false');
  await page.getByRole('switch', { name: 'Transportation' }).click();
  await page.getByRole('switch', { name: 'Photo gallery' }).click();
  await page.getByRole('switch', { name: 'Help' }).click();
  await expect(page.getByRole('status').filter({ hasText: '3 unsaved changes' })).toBeVisible();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect.poll(() => calls.find((call) => call.key === 'PUT /site-visibility')?.body).toEqual({
    items: expect.arrayContaining([
      { key: 'page:/help', visible: true },
      { key: 'page:/transportation', visible: false },
      { key: 'section:home.gallery', visible: false },
    ]),
  });
  await expect(page.getByRole('switch', { name: 'Transportation' })).toHaveAttribute('aria-checked', 'false');
});

test('admin "Add to team": typing a name suggests registered people; picking one fills the form and links the record', async ({ page }) => {
  await en(page);
  await desktop(page);
  const calls = await mockApi(page, {
    'GET /auth/me': ADMIN,
    'GET /event-member-applications': [],
    'GET /event-member-sections/admin': { sections: [{ id: 's-core', key: 'CORE_TEAM', label: 'Core Team', heading: 'Core Team', isCoreTeam: true, status: 'ACTIVE', approved: 0, pending: 0 }], other: { pending: 0 } },
    'GET /event-member-applications/people': [KAMAL],
    'POST /event-member-applications': { status: 201, body: { id: 'n1', status: 'APPROVED' } },
  });
  await page.goto('/admin/event-members?section=CORE_TEAM');
  await page.getByRole('button', { name: 'Add to team' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name *').fill('Kam');
  await dialog.getByRole('option', { name: /Kamal Patidar/ }).click();
  await expect(dialog.getByLabel('Name *')).toHaveValue('Kamal Patidar');
  await expect(dialog.getByRole('combobox', { name: /Village/ })).toHaveValue('Rampura');
  await expect(dialog.getByLabel('Village in Hindi')).toHaveValue('रामपुरा');
  await expect(dialog.getByLabel('Mobile (optional)')).toHaveValue('9876500009');
  await expect(dialog.getByText('Linked to registered record: NPSI-MEM-000090')).toBeVisible();
  await dialog.getByRole('button', { name: 'Add to team' }).click();
  await expect.poll(() => calls.find((call) => call.key === 'POST /event-member-applications')?.body).toMatchObject({ personKind: 'MEMBER', personId: 'm-9', name: 'Kamal Patidar', approveNow: true });
  expect(calls.find((call) => call.key === 'GET /event-member-applications/people').query).toBe('?q=Kam');
});

test('admin event finance: a registered member fills the contribution and links it', async ({ page }) => {
  await en(page);
  await desktop(page);
  const calls = await mockApi(page, {
    'GET /auth/me': ADMIN,
    'GET /event-finance': [{ id: 'event-1', title: 'Garba Night', date: daysAhead(14), status: 'PUBLISHED', venue: 'Hall' }],
    'GET /event-finance/admin/categories': [],
    'GET /event-finance/event-1': {
      event: { id: 'event-1', title: 'Garba Night', date: daysAhead(14), status: 'PUBLISHED', venue: 'Hall' },
      summary: { totalCollection: 0, totalExpenses: 0, remainingBalance: 0, pendingContributions: 0, pendingExpenses: 0 },
      contributions: [], expenses: [], villages: [], categoryTotals: [],
    },
    'GET /event-finance/admin/events/event-1/roster': { members: [], teams: [] },
    'GET /event-member-applications/people': [KAMAL],
    'POST /event-finance/admin/events/event-1/contributions': { status: 201, body: { id: 'c1' } },
  });
  await page.goto('/admin/event-finance');
  await page.getByRole('button', { name: 'Contributions', exact: true }).click();
  await page.getByLabel('Member name').fill('Kamal');
  await page.getByRole('option', { name: /Kamal Patidar/ }).click();
  await expect(page.getByLabel('Family ID')).toHaveValue('NPSI-FAM-000009');
  await expect(page.getByLabel('Mobile')).toHaveValue('9876500009');
  await expect(page.getByLabel('Village', { exact: true })).toHaveValue('Rampura');
  await page.getByLabel('Amount ₹').fill('1100');
  await page.getByRole('button', { name: /Save contribution|Add contribution/ }).first().click();
  await expect.poll(() => calls.find((call) => /POST \/event-finance\/.*contributions/.test(call.key))?.body).toMatchObject({ memberId: 'm-9', memberName: 'Kamal Patidar', familyId: 'NPSI-FAM-000009' });
});
