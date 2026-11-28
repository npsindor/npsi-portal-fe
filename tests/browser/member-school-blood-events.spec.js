import { expect, test } from '@playwright/test';
import { MEMBER, mockApi, NOT_LOGGED_IN } from './mock-api.js';

// Recent additions: School / College and Company name on a family member, the new relationships, the blood group on
// the registration form, the Events page "All Programs" list (latest first) and the home page wording.
const en = (page) => page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
const FAMILY = { id: 'f1', familyId: 'NPSI-FAM-000001', familyName: 'Patidar', headName: 'Subhash Patidar', memberCount: 2, status: 'ACTIVE', registrationDate: '2026-01-02T00:00:00.000Z' };
const member = (fields) => ({ familyId: FAMILY.familyId, gender: 'Male', status: 'ACTIVE', ...fields });
const MEMBERS = [
  member({ id: 'm1', name: 'Subhash Patidar', relationship: 'Head', dob: '1985-03-08', maritalStatus: 'MARRIED' }),
  member({ id: 'm2', name: 'Neha Patidar', relationship: 'Daughter', gender: 'Female', dob: '2004-05-06', schoolCollege: 'DAVV Indore', companyName: 'Infosys' }),
];
const card = (page, name) => page.locator('.premium-card').filter({ has: page.getByText(name, { exact: true }) });

test('add member: School / College and Company name come after Occupation, are trimmed and saved, and show on the card', async ({ page }) => {
  await en(page);
  const calls = await mockApi(page, {
    'GET /auth/me': MEMBER,
    'GET /me/family': { family: FAMILY, members: MEMBERS },
    'POST /family-members': { status: 201, body: member({ id: 'm9', name: 'Abhinandan Patidar', relationship: 'Son', status: 'PENDING' }) },
  });
  await page.goto('/portal/family');
  await expect(card(page, 'Neha Patidar')).toContainText('DAVV Indore');
  await expect(card(page, 'Neha Patidar')).toContainText('Infosys');
  await page.getByRole('button', { name: 'Add Member' }).first().click();
  const relationships = await page.locator('#member-relationship option').evaluateAll((options) => options.map((o) => o.value));
  for (const value of ["Younger Brother's Wife", 'Daughter-in-law', 'Sister-in-law']) expect(relationships).toContain(value);
  // Order in the form: Occupation, then School / College, then Company.
  const ids = await page.locator('[id^="member-"]').evaluateAll((nodes) => nodes.map((n) => n.id));
  expect(ids.indexOf('member-schoolCollege')).toBe(ids.indexOf('member-occupation') + 1);
  expect(ids.indexOf('member-companyName')).toBe(ids.indexOf('member-schoolCollege') + 1);
  await page.getByPlaceholder('Full name').fill('Abhinandan Patidar');
  await page.locator('#member-relationship').selectOption('Son');
  await page.locator('input[type=date]').fill('2000-01-02');
  await page.getByLabel('School / College name').fill('  SGSITS   Indore ');
  await page.getByLabel('Company name').fill(' TCS ');
  await page.locator('#member-maritalStatus').selectOption('UNMARRIED');
  await page.locator('.sticky.bottom-0').getByRole('button', { name: 'Add Member' }).click();
  await expect.poll(() => calls.find((call) => call.key === 'POST /family-members')?.body).toMatchObject({ schoolCollege: 'SGSITS   Indore', companyName: 'TCS' });
});

test('edit member: School / College and Company load back into the form', async ({ page }) => {
  await en(page);
  await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /me/family': { family: FAMILY, members: MEMBERS } });
  await page.goto('/portal/family');
  await card(page, 'Neha Patidar').getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('#member-schoolCollege')).toHaveValue('DAVV Indore');
  await expect(page.locator('#member-companyName')).toHaveValue('Infosys');
});

test('Hindi labels for School / College and Company', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'hi'));
  await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /me/family': { family: FAMILY, members: MEMBERS } });
  await page.goto('/portal/family');
  await page.getByRole('button', { name: 'सदस्य जोड़ें' }).first().click();
  await expect(page.getByLabel('स्कूल / कॉलेज का नाम')).toBeVisible();
  await expect(page.getByLabel('कंपनी का नाम')).toBeVisible();
});

test('registration: the chosen blood group is on the review step and sent with the form', async ({ page }) => {
  await en(page);
  const calls = await mockApi(page, {
    'GET /auth/me': MEMBER,
    'GET /me/registrations': { registrations: [], completion: { percent: 50, missing: ['Family registration'] } },
    'POST /me/payment-screenshots': { fileId: 'payment-shot-1' },
    'POST /me/registrations': { applicationId: 'NPSI-APP-TEST-2' },
  });
  await page.goto('/portal/registration');
  await page.locator('#reg-first').fill('Test');
  await page.locator('#reg-last').fill('Member');
  await page.locator('#reg-gender').selectOption('Female');
  await page.locator('#reg-dob').fill('1995-01-01');
  await page.locator('#reg-marital').selectOption('UNMARRIED');
  expect(await page.locator('#reg-blood option').evaluateAll((o) => o.map((x) => x.value).filter(Boolean))).toEqual(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);
  await page.locator('#reg-blood').selectOption('B+');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.locator('#reg-area').fill('Vijay Nagar');
  await page.locator('#reg-address').fill('100 Test Road');
  await page.locator('#reg-pincode').fill('452010');
  await page.locator('#reg-village').fill('Test Village');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.locator('#reg-screenshot').setInputFiles({ name: 'payment.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9kAAAAASUVORK5CYII=', 'base64') });
  await expect.poll(() => calls.some((call) => call.key === 'POST /me/payment-screenshots')).toBe(true);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByText('B+', { exact: true })).toBeVisible();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('status')).toContainText('NPSI-APP-TEST-2');
  expect(calls.find((call) => call.key === 'POST /me/registrations').body).toMatchObject({ type: 'FAMILY', bloodGroup: 'B+' });
});

test('events: upcoming programmes soonest first, past ones latest first, each in one section', async ({ page }) => {
  await en(page);
  const day = (offset) => new Date(Date.now() + 5.5 * 3600e3 + offset * 86400e3).toISOString().slice(0, 10);
  const event = (id, title, category, date) => ({ id, title, category, date, status: 'PUBLISHED', venue: 'Indore', fee: 0 });
  await mockApi(page, {
    'GET /auth/me': NOT_LOGGED_IN,
    'GET /events': [
      event('e1', 'Swajan Samaroh', 'GENERAL', day(40)),
      event('e3', 'Sneh Deepotsav', 'CULTURAL', day(0)),
      event('e2', 'Maa Na Garba', 'GARBA', day(10)),
      event('e4', 'Holi Milan', 'CULTURAL', day(-30)),
      event('e5', 'Diwali Milan', 'CULTURAL', day(-5)),
    ],
  });
  await page.goto('/events');
  await expect(page.locator('#upcoming').getByRole('heading', { level: 3 })).toHaveText(['Sneh Deepotsav', 'Maa Na Garba', 'Swajan Samaroh']);
  await expect(page.locator('#upcoming #event-e3')).toContainText('Today');
  await expect(page.locator('#past').getByRole('heading', { level: 3 })).toHaveText(['Diwali Milan', 'Holi Milan']);
});

test('home page wording: "One Community. Endless Connections.", "Patidar Connect" and Nimad', async ({ page }) => {
  await en(page);
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  await page.goto('/');
  await expect(page.getByText('One Community. Endless Connections.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Patidar Connect' })).toBeVisible();
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/Nimar/i);
});
