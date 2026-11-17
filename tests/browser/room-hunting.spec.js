import { test, expect } from '@playwright/test';
import { MEMBER, mockApi, NOT_LOGGED_IN } from './mock-api';

// Room Hunting is served by the API: approved listings/requirements are public, contacts follow each owner's choice,
// anyone can post a requirement, and only registered members/students can add a property.
const listing = (over = {}) => ({ id: 'l1', reference: 'RL-0001', propertyType: '1 BHK', availableFor: 'ANY', rentAmount: 9000, area: 'Vijay Nagar', address: null, availableFrom: null, description: 'Near park', photoUrl: null, contactName: 'Ravi P.', mobile: '9876543210', email: null, contactHidden: false, status: 'AVAILABLE', postedAt: '2026-11-01T00:00:00.000Z', ...over });
const OPTIONS = { propertyTypes: [{ value: '1 BHK', hi: '1 बीएचके' }, { value: '2 BHK', hi: '2 बीएचके' }], areas: [{ value: 'Vijay Nagar', hi: 'विजय नगर' }, { value: 'Rau', hi: 'राऊ' }] };
const page1 = (items) => ({ total: items.length, page: 1, pageSize: 12, items });

for (const lang of ['en', 'hi']) {
  test(`${lang}: public listings come from the API and show only the contacts each owner chose`, async ({ page }) => {
    const hi = lang === 'hi';
    await page.addInitScript((value) => localStorage.setItem('pss_lang', value), lang);
    const calls = await mockApi(page, {
      'GET /auth/me': NOT_LOGGED_IN,
      'GET /room-hunting/options': OPTIONS,
      'GET /room-hunting/listings': page1([listing(), listing({ id: 'l2', reference: 'RL-0002', propertyType: '2 BHK', area: 'Rau', mobile: null, contactHidden: true })]),
    });
    await page.goto('/room-hunting');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(hi ? 'अपनों के बीच अपना घर खोजें' : 'Find a home among your own people');
    await expect(page.locator('.room-hero').getByText(hi ? 'आवास सहयोग' : 'Room Hunting', { exact: true })).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(2);
    await expect(page.getByRole('link', { name: '9876543210' })).toHaveCount(1);
    await expect(page.getByText(hi ? 'मालिक ने संपर्क विवरण छिपाया है' : 'The owner has hidden contact details')).toBeVisible();
    // No demo data or browser-only storage.
    expect(await page.evaluate(() => Object.keys(sessionStorage).filter((key) => key.includes('room')))).toEqual([]);
    await page.getByLabel(hi ? 'संपत्ति का प्रकार' : 'Property Type', { exact: true }).selectOption('1 BHK');
    await page.getByRole('button', { name: hi ? 'खोजें' : 'Search', exact: true }).click();
    await expect.poll(() => calls.filter((call) => call.key === 'GET /room-hunting/listings').at(-1)?.query).toContain('type=1+BHK');
  });
}

test('anyone can post a requirement; consent is required and the server reply is shown', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  const calls = await mockApi(page, {
    'GET /auth/me': NOT_LOGGED_IN,
    'GET /room-hunting/options': OPTIONS,
    'GET /room-hunting/listings': page1([]),
    'POST /room-hunting/requirements': { status: 201, body: { id: 'r1', reference: 'RQ-0001', status: 'PENDING', expiresAt: '2027-01-01T00:00:00.000Z', matches: [] } },
  });
  await page.addInitScript(() => { window.grecaptcha = { ready: (callback) => callback(), execute: async () => 'test-recaptcha-token' }; });
  await page.goto('/room-hunting');
  const form = page.locator('#post-requirement');
  await form.getByLabel('Your name *').fill('Mahesh Patidar');
  await form.getByLabel('Mobile number *').fill('9111111111');
  await form.locator('#need-type').fill('1 BHK');
  await form.locator('#need-area').fill('Vijay Nagar');
  await form.getByRole('button', { name: /^₹8,000/ }).click();
  await form.getByRole('button', { name: 'Submit requirement' }).click();
  await expect(form.getByRole('alert')).toBeVisible();
  expect(calls.some((call) => call.key === 'POST /room-hunting/requirements')).toBe(false);
  await form.getByLabel(/I agree that my requirement/).check();
  await form.getByRole('button', { name: 'Submit requirement' }).click();
  await expect(form.getByRole('status')).toContainText('RQ-0001');
  const sent = calls.find((call) => call.key === 'POST /room-hunting/requirements').body;
  expect(sent).toMatchObject({ name: 'Mahesh Patidar', mobile: '9111111111', propertyType: '1 BHK', area: 'Vijay Nagar', minBudget: 8000, maxBudget: 12000, consent: true, showMobile: false });
  expect(sent.clientRequestId).toMatch(/^[0-9a-f-]{36}$/);
});

test('adding a property asks visitors to log in, and non-members to register first', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /room-hunting/options': OPTIONS, 'GET /room-hunting/listings': page1([]) });
  await page.goto('/room-hunting');
  await page.getByRole('button', { name: 'Add Rental Property' }).click();
  await expect(page.getByRole('dialog')).toContainText('registered NPS family members and registered students');
  await expect(page.getByRole('dialog').getByRole('link', { name: 'Log in' })).toHaveAttribute('href', /\/login\?returnTo=%2Froom-hunting/);
});

test('a registered member adds a listing; it is sent for approval', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  const calls = await mockApi(page, {
    'GET /auth/me': MEMBER,
    'GET /room-hunting/options': OPTIONS,
    'GET /room-hunting/listings': page1([]),
    'GET /room-hunting/me': { eligible: true, accountKind: 'FAMILY', listings: [], requirements: [], enquiriesSent: [] },
    'POST /room-hunting/listings': { status: 201, body: listing({ status: 'PENDING' }) },
  });
  await page.goto('/room-hunting');
  await page.getByRole('button', { name: 'Add Rental Property' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('#listing-type').fill('1 BHK');
  await dialog.locator('#listing-area').fill('Vijay Nagar');
  await dialog.getByLabel('Monthly rent (₹) *').fill('9000');
  await dialog.getByRole('button', { name: 'Submit listing' }).click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await dialog.getByLabel(/I own this property/).check();
  await dialog.getByRole('button', { name: 'Submit listing' }).click();
  await expect(page.getByRole('status')).toContainText('It will be public once approved');
  expect(calls.find((call) => call.key === 'POST /room-hunting/listings').body).toMatchObject({ propertyType: '1 BHK', area: 'Vijay Nagar', rentAmount: 9000, contactMobile: '9876500001', showMobile: true, ownerConfirmed: true });
});
