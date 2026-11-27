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

test('family heads carousel: heading, 60px round photos (initials without a photo), ← → buttons, a moving strip that pauses on hover', async ({ page }) => {
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
  const strip = section.locator('.family-heads-strip');
  const left = () => strip.evaluate((el) => el.scrollLeft);
  // Moves on its own.
  const start = await left();
  await expect.poll(left).toBeGreaterThan(start + 20);
  // Next moves forward by whole cards, Previous back (looping around the start).
  await section.getByRole('button', { name: 'Next family heads' }).click();
  await expect.poll(left).toBeGreaterThan(start + 300);
  await section.getByRole('button', { name: 'Previous family heads' }).click();
  await page.waitForTimeout(600);
  expect(await left()).toBeGreaterThanOrEqual(0);
  // Pauses while hovered.
  await strip.hover();
  await page.waitForTimeout(700);
  const paused = await left();
  await page.waitForTimeout(800);
  expect(Math.abs((await left()) - paused)).toBeLessThan(2);
  // Starts again after the pointer leaves.
  await page.mouse.move(5, 5);
  await expect.poll(left, { timeout: 5000 }).toBeGreaterThan(paused + 20);
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

test('admin Families: village column in title case, and the select-all box sets "On website" for every listed family in one request', async ({ page }) => {
  await en(page);
  const families = [
    { id: 'fam-1', familyId: 'NPSI-FAM-000001', familyName: 'PATIDAR', headName: 'deepa patidar', memberCount: 3, city: 'Indore', village: 'GHEGAON', status: 'ACTIVE', showOnHome: true },
    { id: 'fam-2', familyId: 'NPSI-FAM-000002', familyName: 'Patidar', headName: 'Harish Patidar', memberCount: 1, city: 'Indore', village: null, nativePlace: 'pipri', status: 'ACTIVE', showOnHome: false },
  ];
  const calls = await mockApi(page, { 'GET /auth/me': ADMIN, 'GET /families': families, 'PUT /families/home-visibility': { status: 200, body: { updated: 2 } } });
  await page.goto('/admin/families');
  await expect(page.getByRole('columnheader', { name: /Village/ })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /^City$/ })).toHaveCount(0);
  await expect(page.getByRole('cell', { name: 'Ghegaon', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Pipri', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Deepa Patidar', exact: true })).toBeVisible();

  const all = page.getByRole('checkbox', { name: 'All listed families on the website' });
  await expect(all).not.toBeChecked(); // one of two is on: half-ticked, not ticked
  expect(await all.evaluate((el) => el.indeterminate)).toBe(true);
  page.once('dialog', (dialog) => dialog.accept());
  await all.check();
  await expect.poll(() => calls.filter((call) => call.key === 'PUT /families/home-visibility').length).toBe(1);
  expect(calls.find((call) => call.key === 'PUT /families/home-visibility').body).toEqual({ familyIds: ['fam-1', 'fam-2'], showOnHome: true });
  expect(calls.some((call) => call.key.startsWith('PATCH /families/'))).toBe(false);
  await expect(page.getByRole('switch', { name: 'On website: Harish Patidar' })).toBeChecked();
  await expect(all).toBeChecked();
});

// Several birthdays: a greeting card per person (photo and name in the middle), A to Z, in a slider that moves on.
const MANY = [
  { id: 'm3', name: 'Ravi Mukati', place: 'Kasrawad', photoUrl: null },
  { id: 'm1', name: 'Neha Patidar', place: 'Borawan', photoUrl: null },
  { id: 'm2', name: 'Anita Choudhary', place: 'Indore', photoUrl: null },
];
const birthdayRegion = (page, name = 'Today Birthday') => page.getByRole('region', { name, exact: true });
const activeSlide = (page, name) => birthdayRegion(page, name).locator('[aria-roledescription="slide"][aria-hidden="false"]');

for (const width of [390, 1280]) {
  test(`birthday slider at ${width}px: A to Z, arrows, dots and autoplay`, async ({ page }) => {
    await en(page);
    await page.clock.install();
    await page.setViewportSize({ width, height: 900 });
    await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /home-members/family-heads': [], 'GET /home-members/birthdays': MANY });
    await page.goto('/');
    const birthday = page.getByRole('region', { name: 'Today Birthday' });
    await birthday.scrollIntoViewIfNeeded();
    await expect(birthday.getByText('3 birthdays today')).toBeVisible();
    await expect(birthday.locator('[aria-roledescription="slide"]')).toHaveCount(3);
    await expect(activeSlide(page)).toHaveAttribute('aria-label', '1 of 3');
    await expect(activeSlide(page).getByText('Anita Choudhary')).toBeVisible();
    await expect(activeSlide(page).getByRole('img', { name: 'Anita Choudhary' })).toHaveText('AC');
    await expect(activeSlide(page).getByText('Happy Birthday')).toBeVisible();
    // The slider moves on by itself.
    await page.clock.fastForward(4100);
    await expect(activeSlide(page).getByText('Neha Patidar')).toBeVisible();
    await page.getByRole('button', { name: 'Next birthday' }).click();
    await expect(activeSlide(page).getByText('Ravi Mukati')).toBeVisible();
    await page.getByRole('button', { name: 'Next birthday' }).click();
    await expect(activeSlide(page).getByText('Anita Choudhary')).toBeVisible();
    await page.getByRole('button', { name: 'Previous birthday' }).click();
    await expect(activeSlide(page).getByText('Ravi Mukati')).toBeVisible();
    await page.getByRole('button', { name: 'Show Neha Patidar' }).click();
    await expect(page.getByRole('button', { name: 'Show Neha Patidar' })).toHaveAttribute('aria-current', 'true');
    await expect(activeSlide(page).getByText('Neha Patidar')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('one birthday is a single card with no slider controls', async ({ page }) => {
  await en(page);
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /home-members/family-heads': [], 'GET /home-members/birthdays': BIRTHDAYS });
  await page.goto('/');
  const birthday = page.getByRole('region', { name: 'Today Birthday' });
  await birthday.scrollIntoViewIfNeeded();
  await expect(birthday.getByText('Neha Patidar')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next birthday' })).toHaveCount(0);
  await expect(birthday.locator('[aria-roledescription="carousel"]')).toHaveCount(0);
});

test('people who asked for less motion: the slider stays still until they move it (Hindi)', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'hi'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.setViewportSize({ width: 390, height: 844 });
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /home-members/family-heads': [], 'GET /home-members/birthdays': MANY });
  await page.goto('/');
  const birthday = page.getByRole('region', { name: 'आज जन्मदिन' });
  await birthday.scrollIntoViewIfNeeded();
  await expect(birthday.getByText('आज 3 जन्मदिन')).toBeVisible();
  await expect(activeSlide(page, 'आज जन्मदिन')).toHaveAttribute('aria-label', '3 में से 1');
  await page.clock.fastForward(9000);
  await expect(activeSlide(page, 'आज जन्मदिन')).toHaveAttribute('aria-label', '3 में से 1');
  await page.getByRole('button', { name: 'अगला जन्मदिन' }).click();
  await expect(activeSlide(page, 'आज जन्मदिन')).toHaveAttribute('aria-label', '3 में से 2');
});
