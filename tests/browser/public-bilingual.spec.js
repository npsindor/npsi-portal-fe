import { test, expect } from '@playwright/test';
import { mockApi, NOT_LOGGED_IN } from './mock-api';
import { publicNavigation } from '../../src/lib/public-navigation.js';

const setup = async (page, lang = 'en') => {
  await page.addInitScript(value => localStorage.setItem('pss_lang', value), lang);
  return mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
};
const switchLanguage = async (page, toHindi) => {
  await page.locator('header').getByRole('button', { name: toHindi ? 'हिंदी में देखें' : 'View in English', exact: true }).filter({ visible: true }).first().click();
  await expect(page.locator('html')).toHaveAttribute('lang', toHindi ? 'hi' : 'en');
};

for (const lang of ['en', 'hi']) {
  test(`${lang}: every public submenu reaches its route and anchor`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await setup(page, lang);
    await page.goto('/');
    const nav = page.locator('#public-navigation');
    for (let index = 0; index < publicNavigation.length; index++) {
      const item = publicNavigation[index];
      for (const [childIndex, [, to]] of (item.items || [[item.label, item.to]]).entries()) {
        if (item.items) {
          const details = nav.locator('details').nth(index);
          await details.locator('summary').click();
          await details.getByRole('link').nth(childIndex).click();
        } else {
          await nav.getByRole('link', { name: lang === 'hi' ? ({ Feedback: 'सुझाव', 'Contact Us': 'संपर्क करें', 'Room Hunting': 'आवास साथी', Transportation: 'सफ़र साथी', Medical: 'सेहत साथी' }[item.label]) : item.label, exact: true }).click();
        }
        await expect(page).toHaveURL(new URL(to, 'http://127.0.0.1:4173').href);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        const hash = new URL(to, 'http://local').hash;
        if (hash) await expect(page.locator(hash)).toHaveCount(1);
      }
    }
  });

  test(`${lang}: listings search, filter, detail, submission and session reset`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const calls = await setup(page, lang);
    const hi = lang === 'hi';
    await page.goto('/career-business');
    await page.getByLabel(hi ? 'लिस्टिंग खोजें' : 'Search listings', { exact: true }).fill(hi ? 'अकाउंट्स' : 'Accounts');
    await expect(page.getByRole('button', { name: hi ? 'विवरण देखें' : 'View Details', exact: true })).toHaveCount(1);
    await page.getByRole('button', { name: hi ? 'विवरण देखें' : 'View Details', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText(hi ? 'काल्पनिक रिक्ति' : 'Fictional vacancy');
    await page.keyboard.press('Escape');
    await page.getByLabel(hi ? 'लिस्टिंग खोजें' : 'Search listings', { exact: true }).fill('no-match-123');
    await expect(page.getByText(hi ? 'कोई परिणाम नहीं मिला। दूसरी खोज या श्रेणी आज़माएँ।' : 'No results found. Try another search or category.')).toBeVisible();
    await page.getByRole('button', { name: hi ? 'फ़िल्टर हटाएँ' : 'Clear filters' }).click();
    await page.locator('#careers-filter').selectOption('business-directory');
    await expect(page.getByRole('button', { name: hi ? 'विवरण देखें' : 'View Details', exact: true })).toHaveCount(1);
    await page.locator('#careers-title').fill('Demo Example 123');
    await page.locator('#careers-location').fill('Sample city');
    await page.locator('#careers-description').fill('Fictional test listing');
    await page.locator('#careers-category').selectOption('business-promotion');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: hi ? 'डेमो जमा करें' : 'Submit Demo', exact: true }).click();
    await expect(page.getByRole('status')).toContainText(hi ? 'संगठन को कुछ नहीं' : 'Nothing has been sent');
    await expect(page.getByRole('heading', { name: 'Demo Example 123' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Demo Example 123' })).toBeVisible();
    await page.getByRole('button', { name: hi ? 'डेमो रीसेट करें' : 'Reset Demo' }).click();
    await expect(page.getByRole('heading', { name: 'Demo Example 123' })).toHaveCount(0);
    expect(calls.filter(call => call.key.startsWith('POST '))).toHaveLength(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test(`${lang}: private Sagun profile and interest demo`, async ({ page }) => {
    await setup(page, lang);
    const hi = lang === 'hi';
    await page.goto('/sagun?category=bride');
    await page.getByRole('button', { name: hi ? 'विवरण देखें' : 'View Details', exact: true }).click();
    await page.getByRole('button', { name: hi ? 'डेमो रुचि भेजें' : 'Send Demo Interest' }).click();
    await expect(page.getByRole('dialog').getByRole('status')).toContainText(hi ? 'किसी व्यक्ति से संपर्क नहीं' : 'No person has been contacted');
    await page.keyboard.press('Escape');
    await page.locator('#sagun-title').fill('Fictional Private Person');
    await page.locator('#sagun-location').fill('Sample city');
    await page.locator('#sagun-description').fill('Fictional adult profile, age 28');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: hi ? 'निजी डेमो प्रोफाइल सहेजें' : 'Save Private Demo Profile' }).click();
    await expect(page.getByRole('heading', { name: hi ? 'आपकी निजी डेमो प्रोफाइल' : 'Your Private Demo Profiles' })).toBeVisible();
    await expect(page.getByRole('button', { name: hi ? 'विवरण देखें' : 'View Details', exact: true })).toHaveCount(1);
    await page.getByRole('button', { name: hi ? 'हटाएँ' : 'Remove', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Fictional Private Person' })).toHaveCount(0);
  });

  for (const kind of ['contact', 'feedback']) {
    test(`${lang}: ${kind} form validates and returns an honest demo reference`, async ({ page }) => {
      const calls = await setup(page, lang);
      const hi = lang === 'hi';
      await page.goto(kind === 'contact' ? '/contact' : '/public-feedback');
      await page.getByRole('button', { name: hi ? 'डेमो जमा करें' : 'Submit Demo', exact: true }).click();
      expect(await page.locator(`#${kind}-message`).evaluate(element => element.validity.valueMissing)).toBe(true);
      await page.locator(`#${kind}-message`).fill(hi ? 'यह एक काल्पनिक सुझाव है।' : 'A fictional example suggestion.');
      await page.getByRole('checkbox').check();
      await page.getByRole('button', { name: hi ? 'डेमो जमा करें' : 'Submit Demo', exact: true }).click();
      await expect(page.getByRole('status')).toContainText('DEMO-');
      await expect(page.getByRole('status')).toContainText(hi ? 'संगठन को कुछ नहीं' : 'Nothing has been sent');
      expect(calls.filter(call => call.key.startsWith('POST '))).toHaveLength(0);
    });
  }
}

test('mobile language toggle persists and translates existing drafts without losing values', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  await page.goto('/community-services');
  await page.locator('#services-title').fill('Draft example');
  await switchLanguage(page, true);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('समाज को सामुदायिक संसाधनों से जोड़ना');
  await expect(page.locator('#services-title')).toHaveValue('Draft example');
  await expect(page.getByRole('heading', { name: 'रक्तदान जागरूकता शिविर' })).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('समाज को सामुदायिक संसाधनों से जोड़ना');
  await switchLanguage(page, false);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Connecting People with Community Resources');
});

test('live event details and news use authored Hindi content alongside separate samples', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'hi'));
  await mockApi(page, {
    'GET /auth/me': NOT_LOGGED_IN,
    'GET /events': [{ id: 'real-event', status: 'PUBLISHED', title: 'Published Event', title_hi: 'प्रकाशित आयोजन', description: 'Confirmed event details', description_hi: 'पुष्ट आयोजन का पूरा विवरण', venue: 'Confirmed venue', venue_hi: 'पुष्ट स्थान', date: '2026-11-15', fee: 0 }],
    'GET /announcements': [{ id: 'real-news', status: 'Active', type: 'General', title: 'Published Notice', title_hi: 'प्रकाशित सूचना', body: 'Confirmed notice details', body_hi: 'पुष्ट सूचना का पूरा विवरण', date: '2026-10-27' }],
  });
  await page.goto('/events');
  await expect(page.getByRole('heading', { name: 'प्रकाशित आयोजन' })).toBeVisible();
  // Live actions are rendered before the clearly labelled demo workspace.
  await page.locator('section').filter({ has: page.getByRole('heading', { name: 'प्रकाशित आयोजन' }) }).getByRole('button').first().click();
  await expect(page.getByRole('dialog')).toContainText('पुष्ट आयोजन का पूरा विवरण');
  await expect(page.getByRole('dialog')).toContainText('पुष्ट स्थान');
  await page.keyboard.press('Escape');
  await page.goto('/news');
  await expect(page.getByRole('heading', { name: 'प्रकाशित सूचना' })).toBeVisible();
  await expect(page.getByText('पुष्ट सूचना का पूरा विवरण')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'नमूना संदेश' })).toBeVisible();
});
