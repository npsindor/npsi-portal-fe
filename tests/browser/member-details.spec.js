import { expect, test } from '@playwright/test';
import { MEMBER, mockApi } from './mock-api.js';

// Member details: education / occupation / marital status lists, the approval note only for an unmarried adult,
// the head's full name on the membership pass and card, and verifying the account's own mobile from Settings.
const en = (page) => page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
const FAMILY = { id: 'f1', familyId: 'NPSI-FAM-000001', familyName: 'Patidar', headName: 'Subhash Patidar', memberCount: 4, status: 'ACTIVE', registrationDate: '2026-01-02T00:00:00.000Z' };
const member = (fields) => ({ familyId: FAMILY.familyId, gender: 'Male', status: 'ACTIVE', ...fields });
const MEMBERS = [
  member({ id: 'm1', name: 'Subhash Patidar', relationship: 'Head', membershipId: 'NPSI-MEM-000025', dob: '1985-03-08', maritalStatus: 'MARRIED', education: 'BSc Multimedia', occupation: 'IT' }),
  member({ id: 'm2', name: 'Unmarried Adult', relationship: 'Son', status: 'PENDING', dob: '2000-01-02', maritalStatus: 'UNMARRIED' }),
  member({ id: 'm3', name: 'Young Child', relationship: 'Son', status: 'PENDING', dob: '2019-03-04', maritalStatus: 'UNMARRIED', education: '1st' }),
  member({ id: 'm4', name: 'Married Adult', relationship: 'Daughter', gender: 'Female', status: 'PENDING', dob: '1995-05-06', maritalStatus: 'MARRIED' }),
  member({ id: 'm5', name: 'Not Given', relationship: 'Brother', status: 'PENDING', dob: '1990-07-08' }),
];
const NOTE = /Waiting for admin approval/;
const card = (page, name) => page.locator('.premium-card').filter({ has: page.getByText(name, { exact: true }) });

test('the approval note shows only on a pending unmarried adult (18+), not on children, married or unknown members', async ({ page }) => {
  await en(page);
  await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /me/family': { family: FAMILY, members: MEMBERS } });
  await page.goto('/portal/family');
  await expect(card(page, 'Unmarried Adult').getByText(NOTE)).toBeVisible();
  for (const name of ['Young Child', 'Married Adult', 'Not Given', 'Subhash Patidar']) await expect(card(page, name).getByText(NOTE)).toHaveCount(0);
  await expect(card(page, 'Married Adult')).toContainText('Daughter · Female · Married');
  await expect(card(page, 'Young Child')).toContainText('1st');
});

test('add member: education, occupation and marital status are lists, and the choice is saved', async ({ page }) => {
  await en(page);
  const calls = await mockApi(page, {
    'GET /auth/me': MEMBER,
    'GET /me/family': { family: FAMILY, members: MEMBERS },
    'POST /family-members': { status: 201, body: member({ id: 'm9', name: 'Abhinandan Patidar', relationship: 'Son', status: 'PENDING' }) },
  });
  await page.goto('/portal/family');
  await page.getByRole('button', { name: 'Add Member' }).first().click();
  const values = async (id) => page.locator(`#${id} option`).evaluateAll((options) => options.map((o) => o.value).filter(Boolean));
  expect(await values('member-education')).toEqual([
    'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th',
    'Graduate (Pursuing)', 'Graduate', 'Post Graduate (Pursuing)', 'Post Graduate',
  ]);
  expect(await values('member-occupation')).toEqual(['Business', 'Government Job', 'Private Job', 'Retired', 'Student', 'Shopkeeper', 'Doctor']);
  expect(await values('member-maritalStatus')).toEqual(['MARRIED', 'UNMARRIED']);
  await page.getByPlaceholder('Full name').fill('Abhinandan Patidar');
  await page.locator('select').first().selectOption('Son');
  await page.locator('#member-education').selectOption('UKG');
  await page.locator('#member-occupation').selectOption('Student');
  await page.locator('#member-maritalStatus').selectOption('UNMARRIED');
  await page.locator('.sticky.bottom-0').getByRole('button', { name: 'Add Member' }).click();
  await expect.poll(() => calls.find((call) => call.key === 'POST /family-members')?.body).toMatchObject({
    name: 'Abhinandan Patidar', relationship: 'Son', education: 'UKG', occupation: 'Student', maritalStatus: 'UNMARRIED', familyId: FAMILY.familyId,
  });
});

test('editing a member keeps an education / occupation typed before the lists existed', async ({ page }) => {
  await en(page);
  await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /me/family': { family: FAMILY, members: MEMBERS } });
  await page.goto('/portal/family');
  await card(page, 'Subhash Patidar').getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('#member-education')).toHaveValue('BSc Multimedia');
  await expect(page.locator('#member-occupation')).toHaveValue('IT');
  await expect(page.locator('#member-maritalStatus')).toHaveValue('MARRIED');
});

test('Hindi: the lists are in Hindi and still save the same values', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'hi'));
  await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /me/family': { family: FAMILY, members: MEMBERS } });
  await page.goto('/portal/family');
  await page.getByRole('button', { name: 'सदस्य जोड़ें' }).first().click();
  await expect(page.locator('#member-occupation option[value="Government Job"]')).toHaveText('सरकारी नौकरी');
  await expect(page.locator('#member-maritalStatus option[value="UNMARRIED"]')).toHaveText('अविवाहित');
  await expect(page.locator('#member-education option[value="10th"]')).toHaveText('कक्षा 10');
});

test('the membership pass and the digital card show the head’s full name under the family id', async ({ page }) => {
  await en(page);
  await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /me/family': { family: FAMILY, members: MEMBERS } });
  await page.goto('/portal');
  const pass = page.locator('.maroon-pass').first();
  await expect(pass.getByText('NPSI-FAM-000001')).toBeVisible();
  await expect(pass.locator('text=NPSI-FAM-000001 >> xpath=following-sibling::div[1]')).toHaveText('Subhash Patidar');
  await pass.getByRole('button', { name: 'View Digital Membership Card' }).click();
  const digital = page.locator('.maroon-pass').filter({ hasText: 'Tap QR to enlarge' });
  await expect(digital).toContainText('Subhash Patidar');
  await expect(digital.getByText('Patidar', { exact: true })).toHaveCount(0);
});

test('Settings: an unverified mobile is verified with the code sent to it; a verified one shows nothing', async ({ page }) => {
  await en(page);
  let verified = false;
  const calls = await mockApi(page, {
    'GET /me/family': { family: FAMILY, members: MEMBERS },
    'POST /auth/mobile-otps': { ok: true, channel: 'SMS', expiresInSeconds: 600 },
    'POST /auth/mobile-otps/verifications': { verificationToken: 'token-1' },
    'PATCH /auth/me': { ...MEMBER, phoneVerified: true },
  });
  await page.route('**/api/v1/auth/me', (route) =>
    route.request().method() === 'GET' ? route.fulfill({ json: { ...MEMBER, phoneVerified: verified } }) : route.fallback(),
  );
  await page.route('**/api/v1/auth/me', async (route) => {
    if (route.request().method() !== 'PATCH') return route.fallback();
    verified = true;
    return route.fallback();
  });
  await page.goto('/portal/settings#mobile');
  const box = page.getByRole('region', { name: 'Verify your mobile number' });
  await expect(box).toBeVisible();
  await expect(box.locator('#otp-mobile')).toHaveValue('9876500001');
  await box.getByRole('button', { name: /Send/ }).click();
  await box.locator('#otp-code').fill('123456');
  await box.getByRole('button', { name: /Verify/ }).click();
  await expect.poll(() => calls.find((call) => call.key === 'PATCH /auth/me')?.body).toEqual({ phone: '9876500001', phoneVerificationToken: 'token-1' });
  expect(calls.find((call) => call.key === 'POST /auth/mobile-otps').body).toMatchObject({ mobile: '9876500001', purpose: 'REGISTER' });
  await expect(box).toHaveCount(0);
});

test('a registered family adds a member without admin approval: the message says so, and no approval note shows', async ({ page }) => {
  await en(page);
  const added = member({ id: 'm9', name: 'Neha Patidar', relationship: 'Daughter', gender: 'Female', status: 'ACTIVE', dob: '2001-02-03', maritalStatus: 'UNMARRIED' });
  await mockApi(page, {
    'GET /auth/me': MEMBER,
    'GET /me/family': { family: FAMILY, members: [MEMBERS[0]] },
    'POST /family-members': { status: 201, body: added },
  });
  await page.goto('/portal/family');
  await page.getByRole('button', { name: 'Add Member' }).first().click();
  await page.getByPlaceholder('Full name').fill('Neha Patidar');
  await page.locator('select').first().selectOption('Daughter');
  await page.locator('.sticky.bottom-0').getByRole('button', { name: 'Add Member' }).click();
  await expect(page.getByText(/Neha Patidar added to your family\. Members aged 18\+/).first()).toBeVisible();
  await expect(page.getByText(/will approve the new member/)).toHaveCount(0);
});

test('a member whose email is someone else\'s login still waits for the admin, and the message says so', async ({ page }) => {
  await en(page);
  await mockApi(page, {
    'GET /auth/me': MEMBER,
    'GET /me/family': { family: FAMILY, members: [MEMBERS[0]] },
    'POST /family-members': { status: 201, body: member({ id: 'm10', name: 'Other Login', relationship: 'Brother', status: 'PENDING' }) },
  });
  await page.goto('/portal/family');
  await page.getByRole('button', { name: 'Add Member' }).first().click();
  await page.getByPlaceholder('Full name').fill('Other Login');
  await page.locator('select').first().selectOption('Brother');
  await page.locator('.sticky.bottom-0').getByRole('button', { name: 'Add Member' }).click();
  await expect(page.getByText(/Other Login added\. The Sangathan will approve the new member shortly\./).first()).toBeVisible();
});
