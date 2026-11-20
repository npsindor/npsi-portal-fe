import { expect, test } from '@playwright/test';
import { ADMIN, MEMBER, mockApi, NOT_LOGGED_IN } from './mock-api.js';

// Search boxes suggest what is already on the page (admin: records; members: their data; public: content), and the
// header search says when it can't reach the server instead of "no results".
const desktop = (page) => page.setViewportSize({ width: 1280, height: 900 });
const lang = (page, value) => page.addInitScript((l) => localStorage.setItem('pss_lang', l), value);
const family = (id, familyName, headName, village) => ({ id, familyId: id, familyName, headName, village, status: 'ACTIVE', memberCount: 1, createdAt: '2026-11-01T00:00:00.000Z' });

test('admin families: typing suggests matching names / IDs / villages; picking one filters the table (mouse and keyboard)', async ({ page }) => {
  await lang(page, 'en');
  await desktop(page);
  await mockApi(page, {
    'GET /auth/me': ADMIN,
    'GET /families': [family('NPSI-FAM-000001', 'Patidar', 'Ramesh Patidar', 'Rampura'), family('NPSI-FAM-000002', 'Joshi', 'Suresh Joshi', 'Ghegaon'), family('NPSI-FAM-000003', 'Mukati', 'Ram Mukati', 'Rampura')],
  });
  await page.goto('/admin/families');
  const search = page.getByRole('combobox', { name: 'Search by Family ID, Application ID, name, or head...' });
  await search.fill('ram');
  const list = page.getByRole('listbox', { name: 'Suggestions' });
  await expect(list.getByRole('option')).toHaveText(['Ramesh Patidar', 'Rampura', 'Ram Mukati']);
  await list.getByRole('option', { name: 'Ram Mukati' }).click();
  await expect(search).toHaveValue('Ram Mukati');
  await expect(page.getByRole('row', { name: /NPSI-FAM-000003/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /NPSI-FAM-000001/ })).toHaveCount(0);
  await search.fill('ghe');
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(search).toHaveValue('Ghegaon');
  await expect(page.getByRole('row', { name: /NPSI-FAM-000002/ })).toBeVisible();
  await search.press('Escape');
  await expect(list).toHaveCount(0);
});

test('public Sandesh: suggestions are the news titles, in Hindi when the site is in Hindi', async ({ page }) => {
  await lang(page, 'hi');
  await mockApi(page, {
    'GET /auth/me': NOT_LOGGED_IN,
    'GET /announcements': [
      { id: 'n1', status: 'Active', type: 'General', title: 'Garba registration opens', titleHi: 'गरबा पंजीकरण शुरू', body: 'x', date: '2026-11-01' },
      { id: 'n2', status: 'Active', type: 'General', title: 'Blood donation camp', titleHi: 'रक्तदान शिविर', body: 'y', date: '2026-11-02' },
    ],
  });
  await page.goto('/news');
  const search = page.getByRole('combobox', { name: 'संदेश खोजें' });
  await search.fill('गरबा');
  await expect(page.getByRole('listbox', { name: 'सुझाव' }).getByRole('option')).toHaveText(['गरबा पंजीकरण शुरू']);
});

test('member Event Kharcha: suggestions come from the member’s own event list', async ({ page }) => {
  await lang(page, 'en');
  await mockApi(page, {
    'GET /auth/me': MEMBER,
    'GET /me/family': { family: { familyId: 'NPSI-FAM-1', status: 'ACTIVE' }, members: [] },
    'GET /event-finance': [{ id: 'e1', title: 'Navratri Garba Mahotsav', date: '2026-10-12', venue: 'Indore', totalCollection: 0, totalExpenses: 0, remainingBalance: 0 }, { id: 'e2', title: 'Holi Milan', date: '2026-03-01', venue: 'Rau', totalCollection: 0, totalExpenses: 0, remainingBalance: 0 }],
  });
  await page.goto('/portal/event-kharcha');
  const search = page.getByRole('combobox', { name: 'Search events' });
  await search.fill('ga');
  await expect(page.getByRole('listbox', { name: 'Suggestions' }).getByRole('option')).toHaveText(['Navratri Garba Mahotsav']);
});

test('header search: a server error says search is unavailable (not "no results")', async ({ page }) => {
  await lang(page, 'en');
  await desktop(page);
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /search': { status: 500, body: { error: 'Internal Server Error' } } });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open search' }).click();
  await page.getByRole('combobox', { name: 'Search the portal' }).fill('Patidar');
  await expect(page.getByRole('alert').filter({ hasText: 'Search is not available right now' })).toBeVisible();
  await expect(page.getByText('No results for "Patidar"')).toHaveCount(0);
});
