import { expect, test } from '@playwright/test';
import { MEMBER, mockApi, NOT_LOGGED_IN } from './mock-api.js';

const isoYearsAgo = (years, days = 0) => {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - years);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};
const today = () => new Date().toISOString().slice(0, 10);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
});

test('header: "Join the Sangathan" is the highlighted call to action', async ({ page }) => {
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  await page.goto('/');
  const join = page.locator('header').first().getByRole('link', { name: 'Join the Sangathan', exact: true });
  await expect(join).toBeVisible();
  await expect(join).toHaveClass(/join-cta/);
  await expect(page.getByRole('link', { name: 'Join the Organization' })).toHaveCount(0);
});

test('create account: the mobile field keeps 10 digits and the full name is required', async ({ page }) => {
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  await page.goto('/register-account');
  const mobile = page.locator('#otp-mobile');
  await mobile.pressSequentially('987654321099');
  await expect(mobile).toHaveValue('9876543210');
  await mobile.fill('+91 98765 43210');
  await expect(mobile).toHaveValue('9876543210');
  await mobile.fill('098765 43210');
  await expect(mobile).toHaveValue('9876543210');
});

test('member registration: titles, date-of-birth rules, Indore areas and the 62 villages (typing allowed)', async ({ page }) => {
  await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /me/registrations': { registrations: [], completion: null } });
  await page.goto('/portal/registration');
  await expect(page.getByRole('heading', { level: 1, name: 'Member Registration' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Member Registration · ₹500/ })).toBeVisible();

  await page.locator('#reg-first').fill('Test');
  await page.locator('#reg-last').fill('Member');
  await page.locator('#reg-gender').selectOption('Male');
  const dob = page.locator('#reg-dob');
  await expect(dob).toHaveAttribute('max', isoYearsAgo(18));
  for (const value of [today(), isoYearsAgo(18, 1)]) {
    await dob.fill(value);
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.locator('#reg-first'), `${value} must not pass`).toBeVisible();
    await expect(page.locator('#reg-dob-rule')).toHaveClass(/text-destructive/);
  }
  await dob.fill(isoYearsAgo(30));
  await page.getByRole('button', { name: 'Next' }).click();

  const area = page.locator('#reg-area');
  await area.click();
  const areaList = page.getByRole('listbox', { name: /Area/ });
  for (const name of ['Vijay Nagar', 'Sukhliya', 'Bijalpur', 'VIP Paraspar Nagar', 'Treasure Fantasy', 'Vaibhav Nagar']) await expect(areaList.getByRole('option', { name })).toBeVisible();
  await area.fill('bijal');
  await areaList.getByRole('option', { name: 'Bijalpur' }).click();
  await expect(area).toHaveValue('Bijalpur');

  const village = page.locator('#reg-village');
  await village.click();
  await expect(page.getByRole('listbox', { name: /village/i }).getByRole('option')).toHaveCount(62);
  await village.fill('My New Village');
  await expect(page.getByText(/Not in the list/)).toBeVisible();
  await expect(village).toHaveValue('My New Village');
});

test('an approved student is offered "Become a family member", which opens the ₹500 form with their details', async ({ page }) => {
  const student = {
    id: 'stu-app', type: 'STUDENT', status: 'APPROVED', applicationId: 'NPSI-STU-APP-2026-000001', resultId: 'NPSI-STU-000001',
    form: { firstName: 'Ravi', lastName: 'Patidar', gender: 'Male', dob: isoYearsAgo(20), city: 'Indore', area: 'Vijay Nagar', address: '12 Main Road', pincode: '452010', nativeVillage: 'Temla' },
    payment: null,
  };
  await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /me/registrations': { registrations: [student], completion: null } });
  await page.goto('/portal/registration?type=student');
  await page.getByRole('link', { name: 'Become a family member' }).click();
  await expect(page).toHaveURL(/type=family&from=student/);
  await expect(page.getByRole('status').filter({ hasText: 'Your student details have been filled in' })).toBeVisible();
  await expect(page.locator('#reg-first')).toHaveValue('Ravi');
  await expect(page.locator('#reg-dob')).toHaveValue(student.form.dob);
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.locator('#reg-area')).toHaveValue('Vijay Nagar');
  await expect(page.locator('#reg-village')).toHaveValue('Temla');
});

test('my family: an eligible member can be shown in Sagun; the form opens for that member', async ({ page }) => {
  const family = { familyId: 'NPSI-FAM-000001', familyName: 'Patidar', headName: 'Ram Patidar', status: 'ACTIVE' };
  const members = [
    { id: 'm-head', familyId: family.familyId, name: 'Ram Patidar', relationship: 'Head', gender: 'Male', dob: '1975-01-01', status: 'ACTIVE' },
    { id: 'm-son', familyId: family.familyId, name: 'Ravi Patidar', relationship: 'Son', gender: 'Male', dob: isoYearsAgo(24), status: 'ACTIVE' },
    { id: 'm-kid', familyId: family.familyId, name: 'Riya Patidar', relationship: 'Daughter', gender: 'Female', dob: isoYearsAgo(10), status: 'ACTIVE' },
  ];
  const eligible = (id, gender, ok, extra = {}) => ({ id, gender, eligible: ok, reason: ok ? null : 'UNDERAGE', minimumAge: gender === 'MALE' ? 21 : 18, application: null, ...extra });
  await mockApi(page, {
    'GET /auth/me': MEMBER,
    'GET /me/family': { family, members },
    'GET /sagun/eligible-members': {
      family, registrationEnabled: true,
      members: [
        eligible('m-head', 'MALE', false, { reason: 'ALREADY_APPLIED', application: { id: 'sp-1', status: 'APPROVED', reference: 'SG-1', mine: true } }),
        eligible('m-son', 'MALE', true),
        eligible('m-kid', 'FEMALE', false),
      ],
    },
  });
  await page.goto('/portal/family');
  await expect(page.getByLabel('Show in Sagun (matrimonial)')).toHaveCount(2);
  const head = page.locator('#sagun-m-head');
  await expect(head).toBeChecked();
  await expect(page.getByText('Visible in Sagun')).toBeVisible();
  await expect(page.locator('#sagun-m-kid')).toHaveCount(0);
  await page.locator('#sagun-m-son').click();
  await expect(page).toHaveURL(/\/sagun\?category=groom&member=m-son$/);
});
