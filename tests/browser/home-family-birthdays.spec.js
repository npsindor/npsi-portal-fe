import { expect, test } from '@playwright/test';
import { ADMIN, mockApi, NOT_LOGGED_IN } from './mock-api.js';

// Home page: the "NPS Family Heads" carousel (60×60 round photos, slow endless strip) and the "Today Birthday"
// column beside "Get started"; Admin → Families decides which families appear.
const en = (page) => page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
const HEADS = [
  { id: 'f1', name: 'Subhash Patidar', place: 'Borawan', photoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>' },
  { id: 'f2', name: 'Ramesh Mukati', place: 'Kasrawad', photoUrl: null },
];
const BIRTHDAYS = [{ id: 'm1', name: 'Neha Patidar', place: 'Borawan', photoUrl: null }];

test('family heads carousel: heading, 60px round photos (initials without a photo), a moving strip that pauses on hover', async ({ page }) => {
  await en(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /home-members/family-heads': HEADS, 'GET /home-members/birthdays': [] });
  await page.goto('/');
  const section = page.getByRole('region', { name: 'NPS Family Heads' });
  await expect(section.getByRole('heading', { name: 'NPS Family Heads' })).toBeVisible();
  const list = section.getByRole('list', { name: 'NPS Family Heads' });
  const photo = list.getByRole('img', { name: 'Subhash Patidar' }).first();
  expect(await photo.evaluate((el) => [el.offsetWidth, el.offsetHeight, getComputedStyle(el).borderRadius])).toEqual([60, 60, '9999px']);
  await expect(list.getByRole('img', { name: 'Ramesh Mukati' }).first()).toHaveText('RM');
  const track = section.locator('.family-heads-track');
  expect(await track.evaluate((el) => getComputedStyle(el).animationName)).toBe('family-heads-scroll');
  await section.locator('.family-heads-strip').hover();
  await expect.poll(() => track.evaluate((el) => getComputedStyle(el).animationPlayState)).toBe('paused');
});

test('no chosen family heads: the section is not shown at all', async ({ page }) => {
  await en(page);
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /home-members/family-heads': [], 'GET /home-members/birthdays': [] });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'NPS Family Heads' })).toHaveCount(0);
});

test('Get started is split in two columns with Today Birthday cards; an empty day says so', async ({ page }) => {
  await en(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /home-members/family-heads': [], 'GET /home-members/birthdays': BIRTHDAYS });
  await page.goto('/');
  const birthday = page.getByRole('region', { name: 'Today Birthday' });
  await birthday.scrollIntoViewIfNeeded();
  await expect(birthday.getByText('Happy Birthday').first()).toBeVisible();
  await expect(birthday.getByText('Neha Patidar')).toBeVisible();
  await expect(birthday.getByRole('img', { name: 'Neha Patidar' })).toHaveText('NP');
  const getStarted = page.getByText('Get started', { exact: true });
  const [left, right] = await Promise.all([getStarted.boundingBox(), birthday.boundingBox()]);
  expect(right.x).toBeGreaterThan(left.x + 400);
  expect(Math.abs(right.y - left.y)).toBeLessThan(200);
});

test('Hindi, an empty birthday list, and a phone layout without sideways scrolling', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'hi'));
  await page.setViewportSize({ width: 390, height: 844 });
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /home-members/family-heads': HEADS, 'GET /home-members/birthdays': [] });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'NPS परिवार मुखिया' })).toBeVisible();
  const birthday = page.getByRole('region', { name: 'आज जन्मदिन' });
  await birthday.scrollIntoViewIfNeeded();
  await expect(birthday.getByText('आज किसी का जन्मदिन नहीं है।', { exact: false })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('admin: the "On website" switch saves showOnHome for that family', async ({ page }) => {
  await en(page);
  const family = { id: 'fam-1', familyId: 'NPSI-FAM-000001', familyName: 'Patidar', headName: 'Subhash Patidar', memberCount: 3, city: 'Indore', status: 'ACTIVE', showOnHome: false };
  const calls = await mockApi(page, { 'GET /auth/me': ADMIN, 'GET /families': [family], 'PATCH /families/fam-1': { status: 200, body: { ...family, showOnHome: true } } });
  await page.goto('/admin/families');
  const toggle = page.getByRole('switch', { name: 'On website: Subhash Patidar' });
  await expect(toggle).not.toBeChecked();
  await toggle.check();
  await expect.poll(() => calls.find((call) => call.key === 'PATCH /families/fam-1')?.body).toEqual({ showOnHome: true });
  await expect(toggle).toBeChecked();
});
