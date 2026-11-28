import { test, expect } from '@playwright/test';
import { mockApi, NOT_LOGGED_IN } from './mock-api';
import { publicNavigation } from '../../src/lib/public-navigation.js';
import { publicHindi } from '../../src/lib/public-copy.js';

// An event date 30 days ahead, so the event always counts as upcoming whatever day the tests run.
const UPCOMING = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

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
    // Visits every submenu link in one test: allow more time when the whole suite runs on five browsers at once.
    test.slow();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await setup(page, lang);
    await page.goto('/');
    const nav = page.locator('#public-navigation');
    for (let index = 0; index < publicNavigation.length; index++) {
      const item = publicNavigation[index];
      for (const [childIndex, [, to]] of (item.items || [[item.label, item.to]]).entries()) {
        if (item.items) {
          const details = nav.locator('details').nth(publicNavigation.slice(0, index).filter((other) => other.items).length);
          // The previous navigation closes every dropdown; wait for that before opening this one.
          await expect(details).not.toHaveAttribute('open');
          // Right after a navigation the next page may still be replacing the menu (a fresh one starts closed): open
          // it again until it stays open.
          await expect(async () => {
            if ((await details.getAttribute('open')) === null) await details.locator('summary').click();
            await expect(details).toHaveAttribute('open', '', { timeout: 1000 });
          }).toPass({ timeout: 15000 });
          await details.getByRole('link').nth(childIndex).click();
        } else {
          await nav.getByRole('link', { name: lang === 'hi' ? ({ Feedback: 'सुझाव', 'Contact Us': 'संपर्क करें', 'Room Hunting': 'आवास सहयोग', 'Travel & Assistance': 'यात्रा एवं सहायता', 'Health Support': 'स्वास्थ्य सहयोग', 'Shagun Bandhan': 'शगुन बंधन' }[item.label] || publicHindi[item.label]) : item.label, exact: true }).click();
        }
        await expect(page).toHaveURL(new URL(to, new URL(page.url()).origin).href);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        const hash = new URL(to, 'http://local').hash;
        if (hash) await expect(page.locator(hash)).toHaveCount(1);
      }
    }
  });

  test(`${lang}: Career & Business shows admin-managed jobs and businesses in five sections`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const hi = lang === 'hi';
    await page.addInitScript(value => localStorage.setItem('pss_lang', value), lang);
    const block = (o) => ({ role: 'ITEM', titleHi: null, subtitle: null, subtitleHi: null, body: null, bodyHi: null, mediaType: 'NONE', mediaUrl: null, linkUrl: null, ctaLabel: null, ctaLabelHi: null, sortOrder: 0, active: true, page: 'careers', ...o });
    const calls = await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /page-blocks': [
      block({ id: 'j1', section: 'job-opportunities', title: 'Accounts Executive', titleHi: 'अकाउंट्स एग्जीक्यूटिव', subtitle: 'Patidar Traders · Indore', body: 'B.Com, 2 years experience.', linkUrl: 'https://example.com/apply', ctaLabel: 'Apply', ctaLabelHi: 'आवेदन करें' }),
      block({ id: 'b1', section: 'business-directory', title: 'Shree Electricals', subtitle: 'Electrical contractor' }),
    ] });
    await page.goto('/career-business');
    for (const id of ['job-opportunities', 'post-a-vacancy', 'business-directory', 'career-guidance', 'business-promotion']) await expect(page.locator(`#${id}`)).toHaveCount(1);
    const jobs = page.locator('#job-opportunities');
    await expect(jobs.getByRole('heading', { name: hi ? 'अकाउंट्स एग्जीक्यूटिव' : 'Accounts Executive' })).toBeVisible();
    await expect(jobs.getByRole('link', { name: hi ? 'आवेदन करें' : 'Apply' })).toHaveAttribute('target', '_blank');
    await expect(page.locator('#business-directory').getByRole('heading', { name: 'Shree Electricals' })).toBeVisible();
    await expect(page.getByLabel(hi ? 'लिस्टिंग खोजें' : 'Search listings', { exact: true })).toHaveCount(0);
    expect(calls.filter(call => call.key.startsWith('POST '))).toHaveLength(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test(`${lang}: Shagun requires membership and does not publish demo profiles`, async ({ page }) => {
  // Checks the desktop sidebar / header links (on phones they sit in the menu).
  await page.setViewportSize({ width: 1280, height: 900 });
    await setup(page, lang);
    await page.goto('/sagun');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: lang === 'hi' ? 'सदस्य लॉगिन' : 'Member Login', exact: true }).filter({ visible: true }).last()).toHaveAttribute('href', '/login?returnTo=%2Fsagun');
    await expect(page.getByRole('button', { name: 'Send Demo Interest' })).toHaveCount(0);
  });

  for (const kind of ['contact', 'feedback']) {
    test(`${lang}: ${kind} form sends a real message to the Sangathan and shows its reference`, async ({ page }) => {
      await setup(page, lang);
      const hi = lang === 'hi';
      const sent = [];
      await page.route('**/api/v1/feedback/public', async (route) => { sent.push(JSON.parse(route.request().postData())); await route.fulfill({ status: 201, json: { reference: 'FB-000042' } }); });
      await page.goto(kind === 'contact' ? '/contact' : '/public-feedback');
      const submit = page.getByRole('button', { name: hi ? 'संदेश भेजें' : 'Send message', exact: true });
      await submit.click();
      await expect(page.getByRole('alert')).toBeVisible();
      await page.locator(`#${kind}-message`).fill(hi ? 'सदस्यता के बारे में जानकारी चाहिए।' : 'Please tell me about membership.');
      if (kind === 'contact') {
        await submit.click();
        await expect(page.getByRole('alert')).toHaveText(hi ? 'उत्तर देने के लिए ईमेल या मोबाइल नंबर दें।' : 'Give an email or mobile number so we can reply.');
        await page.locator('#contact-mobile').fill('9876543210');
      }
      await page.getByRole('checkbox').check();
      await submit.click();
      await expect(page.getByRole('status')).toContainText('FB-000042');
      expect(sent).toHaveLength(1);
      expect(sent[0]).toMatchObject({ kind: kind === 'contact' ? 'CONTACT' : 'FEEDBACK', consent: true, lang });
      expect(await page.evaluate(() => Object.keys(sessionStorage).filter((key) => key.startsWith('nps-demo')))).toEqual([]);
    });
  }
}

test('mobile language toggle persists and translates existing drafts without losing values', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  await page.goto('/community-services');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Donate Blood,Save Lives');
  await switchLanguage(page, true);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('रक्तदान करें,जीवन बचाएँ');
  for (const name of ['रक्तदान', 'आपातकालीन सहायता', 'समाज कल्याण']) await expect(page.getByRole('heading', { level: 2, name, exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('रक्तदान करें,जीवन बचाएँ');
  await switchLanguage(page, false);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Donate Blood,Save Lives');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('live event details and news use authored Hindi content alongside separate samples', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'hi'));
  await mockApi(page, {
    'GET /auth/me': NOT_LOGGED_IN,
    'GET /events': [{ id: 'real-event', status: 'PUBLISHED', title: 'Published Event', title_hi: 'प्रकाशित आयोजन', description: 'Confirmed event details', description_hi: 'पुष्ट आयोजन का पूरा विवरण', venue: 'Confirmed venue', venue_hi: 'पुष्ट स्थान', date: UPCOMING, fee: 0 }],
    'GET /announcements': [{ id: 'real-news', status: 'Active', type: 'General', title: 'Published Notice', title_hi: 'प्रकाशित सूचना', body: 'Confirmed notice details', body_hi: 'पुष्ट सूचना का पूरा विवरण', date: '2026-10-27' }],
  });
  await page.goto('/events');
  const programs = page.locator('#upcoming');
  await expect(programs.getByRole('heading', { name: 'प्रकाशित आयोजन' })).toBeVisible();
  // Live actions are rendered before the clearly labelled demo workspace.
  await programs.getByRole('button').first().click();
  await expect(page.getByRole('dialog')).toContainText('पुष्ट आयोजन का पूरा विवरण');
  await expect(page.getByRole('dialog')).toContainText('पुष्ट स्थान');
  await page.keyboard.press('Escape');
  await page.goto('/news');
  await expect(page.getByRole('heading', { name: 'प्रकाशित सूचना' })).toBeVisible();
  await expect(page.getByText('पुष्ट सूचना का पूरा विवरण')).toBeVisible();
  await expect(page.locator('#notices').getByRole('heading', { name: 'प्रकाशित सूचना' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'नमूना संदेश' })).toHaveCount(0);
});
