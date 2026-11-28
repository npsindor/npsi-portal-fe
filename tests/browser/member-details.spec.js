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
    'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th', 'Diploma',
    'Graduate (Pursuing)', 'Graduate', 'Post Graduate (Pursuing)', 'Post Graduate',
  ]);
  expect(await values('member-occupation')).toEqual(['Business', 'Government Job', 'Private Job', 'Retired', 'Student', 'Shopkeeper', 'Doctor', 'Housewife']);
  expect(await values('member-maritalStatus')).toEqual(['MARRIED', 'UNMARRIED']);
  await page.getByPlaceholder('Full name').fill('Abhinandan Patidar');
  await page.locator('select').first().selectOption('Son');
  await page.locator('input[type=date]').fill('2000-01-02');
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

test('Housewife is an occupation (Hindi: गृहिणी) and is saved', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'hi'));
  await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /me/family': { family: FAMILY, members: [MEMBERS[0]] } });
  await page.goto('/portal/family');
  await page.getByRole('button', { name: 'सदस्य जोड़ें' }).first().click();
  await expect(page.locator('#member-occupation option[value="Housewife"]')).toHaveText('गृहिणी');
});

test('son / daughter: Marital Status shows only once the birth date makes them 18+; other relations always see it', async ({ page }) => {
  await en(page);
  const calls = await mockApi(page, {
    'GET /auth/me': MEMBER,
    'GET /me/family': { family: FAMILY, members: [MEMBERS[0]] },
    'POST /family-members': { status: 201, body: member({ id: 'm20', name: 'Little One', relationship: 'Daughter', status: 'ACTIVE' }) },
  });
  await page.goto('/portal/family');
  await page.getByRole('button', { name: 'Add Member' }).first().click();
  const marital = page.locator('#member-maritalStatus');
  const dob = page.locator('input[type=date]');
  const yearsAgo = (years, days = 0) => { const d = new Date(); d.setFullYear(d.getFullYear() - years); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };
  await expect(marital).toBeVisible();
  await page.locator('select').first().selectOption('Daughter');
  await expect(marital).toHaveCount(0);
  await dob.fill(yearsAgo(17));
  await expect(marital).toHaveCount(0);
  await dob.fill(yearsAgo(18, -1));
  await expect(marital).toBeVisible();
  await marital.selectOption('UNMARRIED');
  await page.locator('select').first().selectOption('Son');
  await expect(marital).toBeVisible();
  await page.locator('select').first().selectOption('Brother');
  await dob.fill(yearsAgo(10));
  await expect(marital).toBeVisible();
  // A child under 18 is saved without a marital status, even if one was picked before the birth date changed.
  await page.locator('select').first().selectOption('Daughter');
  await page.getByPlaceholder('Full name').fill('Little One');
  await page.locator('.sticky.bottom-0').getByRole('button', { name: 'Add Member' }).click();
  await expect.poll(() => calls.find((call) => call.key === 'POST /family-members')?.body).toMatchObject({ name: 'Little One', relationship: 'Daughter', maritalStatus: null });
});

test('add member: address and mobile start from the owner\'s own record and can be changed', async ({ page }) => {
  await en(page);
  const members = [{ ...MEMBERS[0], address: '12 Vijay Nagar, Indore', mobile: '+91 98260 11111' }, ...MEMBERS.slice(1)];
  const calls = await mockApi(page, {
    'GET /auth/me': MEMBER,
    'GET /me/family': { family: FAMILY, members },
    'POST /family-members': { status: 201, body: member({ id: 'm9', name: 'Kid Patidar', relationship: 'Son' }) },
  });
  await page.goto('/portal/family');
  await page.getByRole('button', { name: 'Add Member' }).first().click();
  await expect(page.locator('#member-address')).toHaveValue('12 Vijay Nagar, Indore');
  await expect(page.locator('#member-mobile')).toHaveValue('9826011111');
  await expect(page.getByText(/Filled in from your own record/)).toHaveCount(2);
  // A new member is never offered as the owner's own record when one exists.
  await expect(page.locator('#member-relationship option[value="Head"]')).toHaveCount(0);
  await page.getByPlaceholder('Full name').fill('Kid Patidar');
  await page.locator('#member-relationship').selectOption('Son');
  await page.locator('#member-address').fill('Hostel, Bhopal');
  await page.locator('.sticky.bottom-0').getByRole('button', { name: 'Add Member' }).click();
  await expect.poll(() => calls.find((call) => call.key === 'POST /family-members')?.body).toMatchObject({
    name: 'Kid Patidar', relationship: 'Son', address: 'Hostel, Bhopal', mobile: '9826011111',
  });
});

test('editing the owner\'s own record offers "Self (Head)" as the relationship', async ({ page }) => {
  await en(page);
  await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /me/family': { family: FAMILY, members: MEMBERS } });
  await page.goto('/portal/family');
  await card(page, 'Subhash Patidar').getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('#member-relationship')).toHaveValue('Head');
  await expect(page.locator('#member-relationship option[value="Head"]')).toHaveText('Self (Head)');
  await page.reload();
  await card(page, 'Young Child').getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('#member-relationship option[value="Head"]')).toHaveCount(0);
});

test('the head\'s card has no Remove, and its relationship is locked to Head (other members keep both)', async ({ page }) => {
  await en(page);
  await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /me/family': { family: FAMILY, members: MEMBERS } });
  await page.goto('/portal/family');
  await expect(card(page, 'Subhash Patidar').getByRole('button', { name: 'Remove' })).toHaveCount(0);
  await expect(card(page, 'Young Child').getByRole('button', { name: 'Remove' })).toHaveCount(1);
  await card(page, 'Subhash Patidar').getByRole('button', { name: 'Edit' }).click();
  const relationship = page.locator('#member-relationship');
  await expect(relationship).toBeDisabled();
  await expect(relationship).toHaveValue('Head');
  await expect(relationship.locator('option')).toHaveCount(1);
  await expect(page.getByText('The head of the family stays the head.')).toBeVisible();
  await page.reload();
  await card(page, 'Young Child').getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('#member-relationship')).toBeEnabled();
});

test('Settings: the account email is shown and changed with the password and a code sent to the new address', async ({ page }) => {
  await en(page);
  const calls = await mockApi(page, {
    'GET /auth/me': { ...MEMBER, phoneVerified: true },
    'GET /me/family': { family: FAMILY, members: MEMBERS },
    'POST /auth/email-changes': { ok: true, expiresInSeconds: 600 },
    'POST /auth/email-changes/confirmations': { ...MEMBER, email: 'mine@example.com' },
  });
  await page.goto('/portal/settings');
  const box = page.getByRole('region', { name: 'Account email' });
  await expect(box).toContainText('ram@example.com');
  await box.getByRole('button', { name: 'Change email' }).click();
  await box.getByLabel('New email').fill('mine@example.com');
  await box.getByLabel('Current password').fill('Secret@123');
  await box.getByRole('button', { name: 'Send code' }).click();
  await expect(box.getByRole('status')).toContainText('mine@example.com');
  expect(calls.find((c) => c.key === 'POST /auth/email-changes')?.body).toEqual({ email: 'mine@example.com', currentPassword: 'Secret@123' });
  await box.getByLabel('Code from the new email').fill('12a3456');
  await expect(box.getByLabel('Code from the new email')).toHaveValue('123456');
  await box.getByRole('button', { name: 'Confirm new email' }).click();
  await expect.poll(() => calls.find((c) => c.key === 'POST /auth/email-changes/confirmations')?.body).toEqual({ code: '123456' });
  await expect(page.getByText('Email changed. Other devices were signed out.').first()).toBeVisible();
});

test('Settings: a wrong password is explained in Hindi', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'hi'));
  await mockApi(page, {
    'GET /auth/me': { ...MEMBER, phoneVerified: true },
    'GET /me/family': { family: FAMILY, members: MEMBERS },
    'POST /auth/email-changes': { status: 401, body: { error: 'Current password is incorrect.' } },
  });
  await page.goto('/portal/settings');
  const box = page.getByRole('region', { name: 'खाते का ईमेल' });
  await box.getByRole('button', { name: 'ईमेल बदलें' }).click();
  await box.getByLabel('नया ईमेल').fill('mine@example.com');
  await box.getByLabel('वर्तमान पासवर्ड').fill('wrong');
  await box.getByRole('button', { name: 'कोड भेजें' }).click();
  await expect(box.getByRole('alert')).toHaveText('वर्तमान पासवर्ड गलत है।');
});

test('a spouse is saved as married without asking, and gets no Shagun Bandhan checkbox', async ({ page }) => {
  await en(page);
  const spouse = member({ id: 'm6', name: 'Sunita Patidar', relationship: 'Spouse', gender: 'Female', dob: '1990-02-03' });
  const calls = await mockApi(page, {
    'GET /auth/me': MEMBER,
    'GET /me/family': { family: FAMILY, members: [...MEMBERS, spouse] },
    // The server decides eligibility: a spouse is MARRIED by relationship, so no checkbox.
    'GET /sagun/eligible-members': { members: [{ id: 'm6', eligible: false, reason: 'MARRIED', gender: 'FEMALE', application: null }] },
    'POST /family-members': { status: 201, body: member({ id: 'm7', name: 'New Spouse', relationship: 'Spouse' }) },
  });
  await page.goto('/portal/family');
  await expect(card(page, 'Sunita Patidar')).toContainText('Spouse · Female');
  await expect(card(page, 'Sunita Patidar').getByRole('checkbox')).toHaveCount(0);
  await page.getByRole('button', { name: 'Add Member' }).first().click();
  await page.getByPlaceholder('Full name').fill('New Spouse');
  await page.locator('#member-relationship').selectOption('Spouse');
  await expect(page.locator('#member-maritalStatus')).toHaveCount(0);
  await page.locator('.sticky.bottom-0').getByRole('button', { name: 'Add Member' }).click();
  await expect.poll(() => calls.find((call) => call.key === 'POST /family-members')?.body).toMatchObject({ relationship: 'Spouse', maritalStatus: 'MARRIED' });
});

test('education list follows the relationship: a son from LKG, a brother / spouse / parent from 8th', async ({ page }) => {
  await en(page);
  await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /me/family': { family: FAMILY, members: MEMBERS } });
  await page.goto('/portal/family');
  await page.getByRole('button', { name: 'Add Member' }).first().click();
  const values = () => page.locator('#member-education option').evaluateAll((options) => options.map((o) => o.value).filter(Boolean));
  await page.locator('#member-relationship').selectOption('Son');
  expect((await values())[0]).toBe('LKG');
  await page.locator('#member-education').selectOption('3rd');
  for (const relationship of ['Brother', 'Sister', 'Spouse', 'Father', 'Mother']) {
    await page.locator('#member-relationship').selectOption(relationship);
    const list = await values();
    expect(list[0], relationship).toBe('8th');
    expect(list).not.toContain('7th');
    expect(list).toContain('Post Graduate');
  }
  // The class chosen for the son doesn't fit a brother: it is cleared.
  await expect(page.locator('#member-education')).toHaveValue('');
  await page.locator('#member-relationship').selectOption('Daughter');
  expect((await values())[0]).toBe('LKG');
});

test('Shagun Bandhan box: never on a spouse, father or mother', async ({ page }) => {
  await en(page);
  const members = [...MEMBERS, member({ id: 'm6', name: 'Wife Patidar', relationship: 'Spouse', gender: 'Female', dob: '1990-01-01' })];
  await mockApi(page, {
    'GET /auth/me': MEMBER,
    'GET /me/family': { family: FAMILY, members },
    // Even if an older server still called her eligible.
    'GET /sagun/eligible-members': { members: [{ id: 'm6', eligible: true, application: null }, { id: 'm2', eligible: true, application: null }] },
  });
  await page.goto('/portal/family');
  await expect(card(page, 'Unmarried Adult').getByText('Show in Shagun Bandhan')).toBeVisible();
  await expect(card(page, 'Wife Patidar').getByText('Show in Shagun Bandhan')).toHaveCount(0);
  await expect(card(page, 'Wife Patidar')).toContainText('Spouse');
});
