import { test, expect } from '@playwright/test';
import { mockApi, NOT_LOGGED_IN } from './mock-api';
import { navLink } from './nav-helpers.js';

for (const lang of ['en', 'hi']) {
  for (const width of [390, 1440]) {
    test(`${lang} ${width}: companion services sit under the Services menu with working pages`, async ({ page }) => {
      const hi = lang === 'hi';
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(value => localStorage.setItem('pss_lang', value), lang);
      await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
      await page.goto('/');
      const nav = page.locator('#public-navigation');
      for (const [english, hindi, path, heading] of [
        ['Transportation', 'यातायात सहयोग', '/transportation', hi ? 'साथ सफ़र करें। एक-दूसरे की मदद करें।' : 'Travel Together. Help Each Other.'],
        ['Health Support', 'स्वास्थ्य सहयोग', '/medical', hi ? 'विश्वसनीय जानकारी। ज़िम्मेदार सहायता।' : 'Trusted Resources. Responsible Assistance.'],
        ['Room Hunting', 'आवास सहयोग', '/room-hunting', hi ? 'अपनों के बीच अपना घर खोजें' : 'Find a home among your own people'],
      ]) {
        if (width < 1280) await page.getByRole('button', { name: hi ? 'नेविगेशन मेनू खोलें' : 'Open navigation menu', exact: true }).click();
        const link = await navLink(page, english, { hi, text: hi ? hindi : english });
        await expect(link).toBeVisible();
        await link.click();
        await expect(page).toHaveURL(new RegExp(`${path}$`));
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
      if (width < 1280) await page.getByRole('button', { name: hi ? 'नेविगेशन मेनू खोलें' : 'Open navigation menu', exact: true }).click();
      // Community Services is one page with its three sections, under the Community menu.
      await (await navLink(page, 'Community Services', { hi })).click();
      await expect(page).toHaveURL(/\/community-services$/);
      for (const id of ['blood-donation', 'emergency-help', 'social-welfare']) await expect(page.locator(`#${id}`)).toHaveCount(1);
      await page.goto('/medical');
      await expect(page.locator('#health-category')).toBeVisible();

    });
  }
}
