import { expect, test } from '@playwright/test';
import { MEMBER, mockApi, NOT_LOGGED_IN } from './mock-api.js';

// "Join the Sangathan" offers both ways in: register as a family or as a student, each with its own login.
const lang = (page, value) => page.addInitScript((l) => localStorage.setItem('pss_lang', l), value);
const desktop = (page) => page.setViewportSize({ width: 1280, height: 900 });
const STUDENT_FORM = '/portal/registration?type=student';

test('header "Join the Sangathan" opens the choice: family or student, each starting the right registration', async ({ page }) => {
  await lang(page, 'en');
  await desktop(page);
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  await page.goto('/');
  await page.getByRole('link', { name: 'Join the Sangathan' }).first().click();
  await expect(page).toHaveURL(/\/join$/);
  await expect(page.getByRole('heading', { level: 1, name: 'How would you like to join?' })).toBeVisible();
  const family = page.getByRole('article', { name: 'Register as a Family' });
  const student = page.getByRole('article', { name: 'Register as a Student' });
  await expect(family).toContainText('Registration fee ₹500');
  await expect(student).toContainText('Registration fee ₹100');
  await expect(family.getByRole('link', { name: 'Start registration' })).toHaveAttribute('href', `/register-account?returnTo=${encodeURIComponent('/portal/registration')}`);
  await expect(student.getByRole('link', { name: 'Start registration' })).toHaveAttribute('href', `/register-account?returnTo=${encodeURIComponent(STUDENT_FORM)}`);
  await expect(family.getByRole('link', { name: /Family Member Login/ })).toHaveAttribute('href', '/login');
  await expect(student.getByRole('link', { name: /Student Login/ })).toHaveAttribute('href', `/login?portal=student&returnTo=${encodeURIComponent(STUDENT_FORM)}`);
  // The student path goes to the account page, which then returns to the student form.
  await student.getByRole('link', { name: 'Start registration' }).click();
  await expect(page).toHaveURL(new RegExp(`/register-account\\?returnTo=${encodeURIComponent(STUDENT_FORM).replace(/[?]/g, '\\?')}$`));
});

test('Hindi: both choices in Hindi', async ({ page }) => {
  await lang(page, 'hi');
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  await page.goto('/join');
  await expect(page.getByRole('heading', { level: 1, name: 'आप किस रूप में जुड़ना चाहते हैं?' })).toBeVisible();
  await expect(page.getByRole('article', { name: 'परिवार के रूप में पंजीकरण' })).toBeVisible();
  await expect(page.getByRole('article', { name: 'विद्यार्थी के रूप में पंजीकरण' })).toContainText('पहले से पंजीकृत? विद्यार्थी लॉगिन');
});

test('a logged-in user goes straight to the chosen registration form (no login links)', async ({ page }) => {
  await lang(page, 'en');
  await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /me/family': { family: null, members: [] } });
  await page.goto('/join');
  await expect(page.getByRole('article', { name: 'Register as a Family' }).getByRole('link', { name: 'Continue to the form' })).toHaveAttribute('href', '/portal/registration');
  await expect(page.getByRole('article', { name: 'Register as a Student' }).getByRole('link', { name: 'Continue to the form' })).toHaveAttribute('href', STUDENT_FORM);
  await expect(page.getByRole('link', { name: /Already registered/ })).toHaveCount(0);
});

test('a registration an admin switched off is not offered', async ({ page }) => {
  await lang(page, 'en');
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /site-visibility': { hidden: ['page:/student-register'] } });
  await page.goto('/join');
  await expect(page.getByRole('article', { name: 'Register as a Family' })).toBeVisible();
  await expect(page.getByRole('article', { name: 'Register as a Student' })).toHaveCount(0);
});
