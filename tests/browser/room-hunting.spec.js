import { test, expect } from '@playwright/test';
import { mockApi, NOT_LOGGED_IN } from './mock-api';

for (const lang of ['en', 'hi']) {
  test(`${lang}: room hunting search, contact privacy, preview and session post`, async ({ page }) => {
    const hi = lang === 'hi';
    await page.setViewportSize({ width: hi ? 390 : 320, height: 900 });
    await page.addInitScript(value => localStorage.setItem('pss_lang', value), lang);
    const calls = await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
    await page.goto('/room-hunting');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(hi ? 'आवास साथी' : 'Room Hunting');
    await expect(page.getByRole('button', { name: hi ? 'संपर्क देखें' : 'View Contact', exact: true })).toHaveCount(2);
    await expect(page.locator('main')).not.toContainText('204');
    await page.getByRole('button', { name: hi ? 'संपर्क देखें' : 'View Contact', exact: true }).first().click();
    await expect(page.getByRole('dialog')).toContainText('204');
    await expect(page.getByRole('dialog')).toContainText(hi ? 'कोई वास्तविक संपर्क नंबर नहीं' : 'No real contact number');
    await page.keyboard.press('Escape');
    await page.locator('#rent-area').selectOption('Vijay Nagar');
    await page.getByRole('button', { name: hi ? '2 बीएचके' : '2 BHK', exact: true }).click();
    await page.getByRole('button', { name: hi ? 'कमरे खोजें' : 'Search Rooms', exact: true }).click();
    await expect(page.getByRole('button', { name: hi ? 'संपर्क देखें' : 'View Contact', exact: true })).toHaveCount(1);
    await page.getByRole('button', { name: hi ? '3 बीएचके' : '3 BHK', exact: true }).click();
    await page.getByRole('button', { name: hi ? 'कमरे खोजें' : 'Search Rooms', exact: true }).click();
    await expect(page.getByText(hi ? 'आपकी खोज से मेल खाने वाला कमरा नहीं मिला।' : 'No rooms match your search.')).toBeVisible();
    await page.getByRole('button', { name: hi ? 'फ़िल्टर हटाएँ' : 'Clear filters', exact: true }).click();
    await page.getByRole('button', { name: hi ? 'लिस्टिंग का पूर्वावलोकन' : 'Preview Listing', exact: true }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await page.locator('#post-area').selectOption('Bhawarkuan');
    await page.locator('#post-house').fill('DEMO-301');
    await page.locator('input[name="post-type"][value="room"]').check();
    await page.locator('#post-rent').fill('6500');
    await page.locator('#post-phone').fill('123');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: hi ? 'लिस्टिंग का पूर्वावलोकन' : 'Preview Listing', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText(hi ? 'मान्य 10 अंकों' : 'valid 10-digit');
    // Synthetic test input only; never makes a network call or contact attempt.
    await page.locator('#post-phone').fill('9000000000');
    await page.getByRole('button', { name: hi ? 'लिस्टिंग का पूर्वावलोकन' : 'Preview Listing', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText('DEMO-301');
    await page.getByRole('button', { name: hi ? 'विवरण बदलें' : 'Edit Details' }).click();
    await expect(page.locator('#post-house')).toHaveValue('DEMO-301');
    await page.getByRole('button', { name: hi ? 'लिस्टिंग का पूर्वावलोकन' : 'Preview Listing', exact: true }).click();
    await page.getByRole('button', { name: hi ? 'डेमो लिस्टिंग सहेजें' : 'Save Demo Listing' }).click();
    await expect(page.getByRole('button', { name: hi ? 'संपर्क देखें' : 'View Contact', exact: true })).toHaveCount(3);
    await expect(page.locator('main')).not.toContainText('DEMO-301');
    await page.reload();
    await expect(page.getByRole('button', { name: hi ? 'संपर्क देखें' : 'View Contact', exact: true })).toHaveCount(3);
    await page.getByRole('button', { name: hi ? 'संपर्क देखें' : 'View Contact', exact: true }).first().click();
    await expect(page.getByRole('dialog')).toContainText('9000000000');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: hi ? 'मेरी डेमो पोस्ट हटाएँ' : 'Clear My Demo Posts' }).click();
    await expect(page.getByRole('button', { name: hi ? 'संपर्क देखें' : 'View Contact', exact: true })).toHaveCount(2);
    expect(calls.filter(call => call.key.startsWith('POST '))).toHaveLength(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
