import { test, expect } from '@playwright/test';
import { mockApi, NOT_LOGGED_IN } from './mock-api';

for (const lang of ['en', 'hi']) {
  for (const width of [390, 1440]) {
    test(`${lang} ${width}: companion services are direct menu links with working pages`, async ({ page }) => {
      const hi = lang === 'hi';
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(value => localStorage.setItem('pss_lang', value), lang);
      await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
      await page.goto('/');
      const nav = page.locator('#public-navigation');
      for (const [english, hindi, path, heading] of [
        ['Transportation', 'सफ़र साथी', '/transportation', hi ? 'साथ सफ़र करें। एक-दूसरे की मदद करें।' : 'Travel Together. Help Each Other.'],
        ['Medical', 'सेहत साथी', '/medical', hi ? 'विश्वसनीय जानकारी। ज़िम्मेदार सहायता।' : 'Trusted Resources. Responsible Assistance.'],
        ['Room Hunting', 'आवास साथी', '/room-hunting', hi ? 'आवास साथी' : 'Room Hunting'],
      ]) {
        if (width < 1280) await page.getByRole('button', { name: hi ? 'नेविगेशन मेनू खोलें' : 'Open navigation menu', exact: true }).click();
        const link = nav.locator(':scope > div > a').filter({ hasText: hi ? hindi : english });
        await expect(link).toHaveCount(1);
        await link.click();
        await expect(page).toHaveURL(new RegExp(`${path}$`));
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
      if (width < 1280) await page.getByRole('button', { name: hi ? 'नेविगेशन मेनू खोलें' : 'Open navigation menu', exact: true }).click();
      const details = nav.locator('details').filter({ has: page.locator('summary').filter({ hasText: hi ? 'सामुदायिक सेवाएँ' : 'Community Services' }) });
      await details.locator('summary').click();
      await expect(details.getByRole('link')).toHaveCount(3);
      await expect(details.getByRole('link', { name: hi ? 'किराया और संपत्ति' : 'Rent & Property', exact: true })).toHaveCount(0);
      await expect(details.getByRole('link', { name: hi ? 'परिवहन' : 'Transport', exact: true })).toHaveCount(0);
      await page.goto('/medical');
      await expect(page.locator('#health-category')).toBeVisible();

    });
  }
}
