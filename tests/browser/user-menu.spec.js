import { expect, test } from '@playwright/test';
import { MEMBER, mockApi, NOT_LOGGED_IN } from './mock-api.js';

for (const [name, width] of [['desktop', 1280], ['mobile', 390]]) {
  test(`${name}: signed-in members get an account menu instead of the join button`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
    await mockApi(page, { 'GET /auth/me': MEMBER });
    await page.goto('/sagun');
    await expect(page.locator('header').first().getByRole('link', { name: 'Join the Sangathan', exact: true })).toHaveCount(0);
    const account = page.getByRole('button', { name: 'Account menu: Ram Patidar' });
    await expect(account).toBeVisible();
    await expect(account.getByText('RP')).toBeVisible();
    await account.click();
    for (const item of ['My Portal', 'Profile', 'Change Password', 'Logout']) await expect(page.getByRole('menuitem', { name: item })).toBeVisible();
    await expect(page.getByRole('menu')).toContainText('ram@example.com');
    if (process.env.SHOTS) await page.waitForTimeout(400), await page.screenshot({ path: `${process.env.SHOTS}/${name}-account-menu.png` });
    await page.getByRole('menuitem', { name: 'Change Password' }).click();
    await expect(page).toHaveURL(/\/portal\/settings\?changePassword=1$/);
    await expect(page.getByRole('dialog', { name: 'Change Password' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/portal\/settings$/);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('guests still see Member Login and Join the Sangathan', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  await page.goto('/sagun');
  await expect(page.locator('header').first().getByRole('link', { name: 'Join the Sangathan', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Account menu/ })).toHaveCount(0);
});
