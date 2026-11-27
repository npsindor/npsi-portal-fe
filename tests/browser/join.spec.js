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

test('a registered member or student is never asked to join or register again', async ({ page }) => {
  await lang(page, 'en');
  await desktop(page);
  for (const type of ['FAMILY', 'STUDENT']) {
    await mockApi(page, { 'GET /auth/me': { ...MEMBER, account: { type, status: 'ACTIVE' } }, 'GET /me/family': { family: null, members: [] } });
    await page.goto('/join');
    await expect(page.getByRole('status').filter({ hasText: 'You are already a registered member' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Go to My Portal' })).toHaveAttribute('href', '/portal');
    await expect(page.getByRole('article')).toHaveCount(0);
    await page.goto('/help');
    await expect(page.getByRole('link', { name: 'Register Now' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Join the Sangathan' })).toHaveCount(0);
  }
});

test('phone header: Member Login and Student Login sit side by side, same size, without opening the menu', async ({ page }) => {
  await lang(page, 'en');
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 760 });
    await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
    await page.goto('/');
    const nav = page.getByTestId('mobile-entry');
    const member = nav.getByRole('link', { name: 'Member Login' });
    const student = nav.getByRole('link', { name: 'Student Login' });
    await expect(member).toBeInViewport();
    await expect(student).toBeInViewport();
    const [a, b] = [await member.boundingBox(), await student.boundingBox()];
    expect(Math.abs(a.y - b.y)).toBeLessThan(1);
    expect(Math.abs(a.height - b.height)).toBeLessThan(1);
    expect(Math.abs(a.width - b.width)).toBeLessThan(2);
    expect(a.height).toBeGreaterThanOrEqual(44);
    expect(b.x + b.width).toBeLessThanOrEqual(width);
    await member.click();
    await expect(page).toHaveURL(/\/login/);
  }
});
