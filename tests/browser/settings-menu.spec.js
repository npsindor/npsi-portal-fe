import { expect, test } from '@playwright/test';
import { MEMBER, mockApi, NOT_LOGGED_IN } from './mock-api.js';

// Portal → Settings: every row opens its page; Terms & Conditions and Privacy Policy are real pages (built-in text,
// replaced by Admin → Page Content entries when an administrator adds them).
const lang = (page, value) => page.addInitScript((v) => localStorage.setItem('pss_lang', v), value);
const ROWS = [
  ['Notifications', /\/portal\/notifications$/, 'Notifications'],
  ['Help & Support', /\/help$/, 'How the Patidar Samaj Portal Works'],
  ['Contact Us', /\/contact$/, null],
  ['Terms & Conditions', /\/terms$/, 'Terms for using the Sangathan portal'],
  ['Privacy Policy', /\/privacy$/, 'How we handle your information'],
  ['About Sangathan', /\/about$/, null],
];

for (const [label, url, heading] of ROWS) {
  test(`settings: "${label}" opens its page`, async ({ page }) => {
    await lang(page, 'en');
    await mockApi(page, { 'GET /auth/me': { ...MEMBER, phoneVerified: true }, 'GET /me/family': { family: null, members: [] } });
    await page.goto('/portal/settings');
    const row = page.getByRole('main').getByRole('link', { name: new RegExp(`^${label.replace(/[&]/g, '\\$&')}`) });
    await expect(row).toBeVisible();
    await row.click();
    await expect(page).toHaveURL(url);
    await expect(page.getByRole('heading', { level: 1, ...(heading ? { name: heading } : {}) }).first()).toBeVisible();
  });
}

test('settings rows in Hindi, and the old "preferences" text is gone', async ({ page }) => {
  await lang(page, 'hi');
  await mockApi(page, { 'GET /auth/me': { ...MEMBER, phoneVerified: true }, 'GET /me/family': { family: null, members: [] } });
  await page.goto('/portal/settings');
  for (const name of ['नियम और शर्तें', 'गोपनीयता नीति', 'संपर्क करें']) await expect(page.getByRole('main').getByRole('link', { name: new RegExp(name) })).toBeVisible();
  await expect(page.getByText('Manage notification preferences')).toHaveCount(0);
});

test('privacy policy: built-in sections in English and Hindi, linked from the footer', async ({ page }) => {
  await lang(page, 'en');
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  await page.goto('/');
  await page.getByRole('contentinfo').getByRole('link', { name: 'Privacy Policy' }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole('heading', { level: 2, name: 'What others can see' })).toBeVisible();
  await expect(page.getByText('Public pages never show phone numbers')).toBeVisible();
  await expect(page.getByText('Last updated')).toBeVisible();
  await page.getByRole('link', { name: 'Terms & Conditions' }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Terms for using the Sangathan portal' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('terms page in Hindi', async ({ page }) => {
  await lang(page, 'hi');
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  await page.goto('/terms');
  await expect(page.getByRole('heading', { level: 1, name: 'संगठन पोर्टल के उपयोग की शर्तें' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: /सामुदायिक सेवाएँ/ })).toBeVisible();
});

test('admin Page Content entries replace the built-in privacy text', async ({ page }) => {
  await lang(page, 'en');
  const block = (id, title, body, sortOrder) => ({ id, page: 'privacy', section: 'main', role: 'ITEM', title, body, titleHi: null, bodyHi: null, mediaType: 'NONE', mediaUrl: null, linkUrl: null, ctaLabel: null, sortOrder, active: true, createdAt: '2026-12-01T10:00:00.000Z', updatedAt: '2026-12-02T10:00:00.000Z' });
  await mockApi(page, {
    'GET /auth/me': NOT_LOGGED_IN,
    'GET /page-blocks': [block('b2', 'Second rule', 'Text two', 2), block('b1', 'First rule', 'Text one', 1)],
  });
  await page.goto('/privacy');
  const headings = page.getByRole('main').getByRole('heading', { level: 2 });
  await expect(headings).toHaveText(['1First rule', '2Second rule']);
  await expect(page.getByText('What others can see')).toHaveCount(0);
  await expect(page.getByText('2 December 2026')).toBeVisible();
});
