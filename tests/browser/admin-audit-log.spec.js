import { expect, test } from '@playwright/test';
import { ADMIN, MEMBER, mockApi } from './mock-api.js';

// Admin → Audit Log: super admin only; every deletion with who, what, when and the deleted record's details.
const en = (page) => page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
const ENTRY = {
  id: 'a1', action: 'DELETE', resource: 'family-members', recordId: 'fm-9', label: 'Rohan Patidar', path: '/api/v1/family-members/fm-9',
  actorUserId: 'u1', actorName: 'Ram Patidar', actorEmail: 'ram@example.com', actorRole: 'MEMBER', createdAt: '2026-11-22T10:30:00Z',
  snapshot: { id: 'fm-9', name: 'Rohan Patidar', relationship: 'Son', familyId: 'NPSI-FAM-000001' },
};
const LIST = { rows: [ENTRY, { ...ENTRY, id: 'a2', resource: 'notifications', label: 'Diwali notice', recordId: 'n1', actorName: 'Admin', actorRole: 'SUPER_ADMIN', snapshot: null }], total: 2, resources: ['family-members', 'notifications'] };

test('super admin: the menu shows Audit Log; entries show who deleted what and the deleted record', async ({ page }) => {
  await en(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  const calls = await mockApi(page, { 'GET /auth/me': ADMIN, 'GET /audit-logs': LIST });
  await page.goto('/admin');
  await page.getByRole('link', { name: 'Audit Log' }).first().click();
  await expect(page).toHaveURL(/\/admin\/audit-log$/);
  await expect(page.getByRole('status')).toHaveText('2 entries');
  const table = page.getByRole('table', { name: 'Audit Log' });
  const row = table.getByRole('row', { name: /Rohan Patidar/ });
  await expect(row).toContainText('Ram Patidar');
  await expect(row).toContainText('Member');
  await expect(row).toContainText('family-members · fm-9');
  await row.getByRole('button', { name: 'Deleted record: Rohan Patidar' }).click();
  await expect(table).toContainText('relationship');
  await expect(table).toContainText('NPSI-FAM-000001');
  await table.getByRole('button', { name: 'Deleted record: Diwali notice' }).click();
  await expect(table.getByText('No copy of this record type is kept')).toBeVisible();
  await page.getByRole('combobox', { name: 'Module' }).selectOption('notifications');
  await page.getByRole('combobox', { name: 'Deleted by' }).selectOption('SUPER_ADMIN');
  await page.getByPlaceholder('Search name, ID, person or address').fill('diwali');
  await expect.poll(() => new URLSearchParams(calls.filter((c) => c.key === 'GET /audit-logs').at(-1).query).get('q')).toBe('diwali');
  expect(Object.fromEntries(new URLSearchParams(calls.filter((c) => c.key === 'GET /audit-logs').at(-1).query))).toMatchObject({ resource: 'notifications', role: 'SUPER_ADMIN', limit: '50', offset: '0' });
});

test('a sub-admin has no Audit Log in the menu and the page refuses them', async ({ page }) => {
  await en(page);
  const staff = { ...MEMBER, adminAccess: { areas: ['PAYMENTS'], allVillages: true } };
  const calls = await mockApi(page, { 'GET /auth/me': staff, 'GET /registration-payments': [] });
  await page.goto('/admin/registration-payments');
  await expect(page.getByRole('heading', { name: 'Registration payments' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Audit Log' })).toHaveCount(0);
  await page.goto('/admin/audit-log');
  await expect(page).not.toHaveURL(/audit-log/);
  expect(calls.some((c) => c.key === 'GET /audit-logs')).toBe(false);
});

test('Hindi labels', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'hi'));
  await mockApi(page, { 'GET /auth/me': ADMIN, 'GET /audit-logs': LIST });
  await page.goto('/admin/audit-log');
  await expect(page.getByRole('heading', { name: 'ऑडिट लॉग' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'किसने डिलीट किया' })).toBeVisible();
});
