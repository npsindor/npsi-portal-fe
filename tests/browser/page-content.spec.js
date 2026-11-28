import { expect, test } from '@playwright/test';
import { ADMIN, mockApi, NOT_LOGGED_IN } from './mock-api.js';
import { flatNavigation } from '../../src/lib/public-navigation.js';

const block = (o) => ({ role: 'ITEM', title: null, titleHi: null, subtitle: null, subtitleHi: null, body: null, bodyHi: null, mediaType: 'NONE', mediaUrl: null, linkUrl: null, ctaLabel: null, ctaLabelHi: null, sortOrder: 0, active: true, createdAt: '', updatedAt: '', ...o });

for (const width of [1440, 390]) {
  test(`${width}px: every menu page shares the header's 12-column container and never scrolls sideways`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
    await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
    for (const { to } of flatNavigation) {
      await page.goto(to);
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
      const result = await page.evaluate(() => {
        const header = document.querySelector('header > div').getBoundingClientRect();
        // The nearest centred container around the page title.
        let node = document.querySelector('h1');
        while (node && node !== document.body) {
          const style = getComputedStyle(node);
          if (style.marginLeft === style.marginRight && parseFloat(style.marginLeft) > 0) break;
          node = node.parentElement;
        }
        const box = (node && node !== document.body ? node : document.querySelector('header > div')).getBoundingClientRect();
        return { headerLeft: Math.round(header.left), headerWidth: Math.round(header.width), left: Math.round(box.left), width: Math.round(box.width), overflow: document.documentElement.scrollWidth > innerWidth };
      });
      expect(result.overflow, to).toBe(false);
      expect([result.left, result.width], to).toEqual([result.headerLeft, result.headerWidth]);
    }
  });
}

test('About Us shows six sections with admin content, entity rules and the built-in fallbacks', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => { if (!localStorage.getItem('pss_lang')) localStorage.setItem('pss_lang', 'en'); });
  await mockApi(page, {
    'GET /auth/me': NOT_LOGGED_IN,
    'GET /page-blocks': [
      block({ id: 'h', page: 'about', section: 'hero', role: 'INTRO', title: 'Serving the samaj since 1995', titleHi: '1995 से समाज की सेवा' }),
      block({ id: 'o1', page: 'about', section: 'objectives', title: 'Digital membership', body: 'Every family registered online.' }),
      block({ id: 'c1', page: 'about', section: 'committee', title: 'Ramesh Patidar', subtitle: 'President' }),
      block({ id: 'x', page: 'about', section: 'objectives', title: 'Hidden objective', active: false }),
    ],
    'GET /rules': [{ id: 'r1', sectionNumber: 1, titleEn: 'Equal respect', titleHi: 'समान सम्मान', contentEn: 'Every member is treated equally.', contentHi: 'हर सदस्य समान।', status: 'Active' }],
  });
  await page.goto('/rules');
  await expect(page).toHaveURL(/\/about#rules$/);
  await expect(page.locator('#rules')).toBeInViewport();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Serving the samaj since 1995');
  for (const id of ['organization', 'vision-mission', 'objectives', 'committee', 'rules', 'principles']) await expect(page.locator(`#${id}`)).toHaveCount(1);
  await expect(page.locator('#objectives').getByRole('heading', { level: 3 })).toHaveText(['Digital membership']);
  await expect(page.locator('#committee').getByText('President')).toBeVisible();
  await expect(page.locator('#rules').getByRole('heading', { name: 'Equal respect' })).toBeVisible();
  await expect(page.locator('#principles').getByRole('listitem')).toHaveCount(6);
  await expect(page.locator('#vision-mission').getByRole('article')).toHaveCount(3);
  await page.evaluate(() => localStorage.setItem('pss_lang', 'hi'));
  await page.goto('/principles');
  await expect(page).toHaveURL(/\/about#principles$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('1995 से समाज की सेवा');
});

test('admins edit page banners and add entries from Page Content', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  const rows = [];
  await mockApi(page, { 'GET /auth/me': ADMIN });
  await page.route('**/api/v1/page-blocks', async (route) => {
    if (route.request().method() === 'POST') {
      const row = block({ ...route.request().postDataJSON(), id: `b${rows.length + 1}` });
      rows.push(row);
      return route.fulfill({ status: 201, json: row });
    }
    return route.fulfill({ json: rows });
  });
  await page.goto('/admin/page-content');
  await page.getByRole('button', { name: 'Career & Business' }).click();
  const jobs = page.getByRole('article', { name: 'Job Opportunities' });
  await jobs.getByRole('button', { name: 'Add entry' }).click();
  await jobs.getByLabel('Title (English)', { exact: true }).fill('Accounts Executive');
  await jobs.getByLabel('Small line under the title (English)').fill('Patidar Traders · Indore');
  await jobs.getByLabel('Button link', { exact: true }).fill('https://example.com/apply');
  await jobs.getByLabel('Button text (English)', { exact: true }).fill('Apply');
  await jobs.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Saved.')).toBeVisible();
  expect(rows[0]).toMatchObject({ page: 'careers', section: 'job-opportunities', role: 'ITEM', title: 'Accounts Executive', linkUrl: 'https://example.com/apply', mediaType: 'NONE', mediaUrl: null });
  await expect(jobs.getByText('Accounts Executive')).toBeVisible();
  const banner = page.getByRole('article', { name: 'Page banner' });
  await banner.getByRole('button', { name: 'Customise' }).click();
  await banner.getByLabel('Title (English)', { exact: true }).fill('Grow together');
  await banner.getByText('Video', { exact: true }).click();
  await banner.getByLabel('YouTube link or .mp4 URL').fill('https://youtu.be/dQw4w9WgXcQ');
  await banner.getByRole('button', { name: 'Save' }).click();
  await expect.poll(() => rows.length).toBe(2);
  expect(rows[1]).toMatchObject({ page: 'careers', section: 'hero', role: 'INTRO', title: 'Grow together', mediaType: 'VIDEO', mediaUrl: 'https://youtu.be/dQw4w9WgXcQ' });
  await expect(banner.getByText('Customised')).toBeVisible();
});

test('an expired session in the admin panel goes to login and back instead of failing with "Authentication required."', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  await mockApi(page, { 'GET /auth/me': ADMIN, 'GET /page-blocks': [], 'POST /page-blocks': { status: 401, body: { error: 'Authentication required.' } } });
  await page.goto('/admin/page-content');
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  const gallery = page.getByRole('article', { name: 'Photo Gallery' });
  await gallery.getByRole('button', { name: 'Add entry' }).click();
  await gallery.getByLabel('Title (English)', { exact: true }).fill('Sammelan');
  await gallery.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fadmin%2Fpage-content$/);
});

test('a banner photo set in Admin → Page Content shows on Travel & Assistance, Health Support, Room Hunting and Shagun', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  await page.route('**/admin-banner.png', (route) => route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9kAAAAASUVORK5CYII=', 'base64') }));
  const hero = (pageKey) => ({ id: `hero-${pageKey}`, page: pageKey, section: 'hero', role: 'INTRO', title: `Banner ${pageKey}`, titleHi: null, subtitle: null, subtitleHi: null, body: null, bodyHi: null, mediaType: 'IMAGE', mediaUrl: '/admin-banner.png', linkUrl: null, ctaLabel: null, ctaLabelHi: null, sortOrder: 0, active: true });
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /page-blocks': ['transportation', 'medical', 'room-hunting', 'sagun'].map(hero) });
  for (const [key, path] of [['transportation', '/travel-assistance'], ['medical', '/medical'], ['room-hunting', '/room-hunting'], ['sagun', '/sagun']]) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: `Banner ${key}` })).toBeVisible();
    await expect(page.locator('img[src="/admin-banner.png"]').first()).toBeAttached();
  }
});

test('banner tagline, heading, text and button come from Admin → Page Content on Career, Sandesh, Health Support and Room Hunting', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'hi'));
  const hero = (pageKey) => ({ id: `hero-${pageKey}`, page: pageKey, section: 'hero', role: 'INTRO', title: `Admin heading ${pageKey}`, titleHi: `एडमिन शीर्षक ${pageKey}`, subtitle: 'Admin tagline', subtitleHi: 'एडमिन टैगलाइन', body: 'Admin text', bodyHi: 'एडमिन विवरण', mediaType: 'NONE', mediaUrl: null, linkUrl: '/contact', ctaLabel: 'Contact us', ctaLabelHi: 'संपर्क करें', sortOrder: 0, active: true });
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /page-blocks': ['careers', 'news', 'medical', 'room-hunting'].map(hero) });
  for (const [key, path] of [['careers', '/career-business'], ['news', '/news'], ['medical', '/medical'], ['room-hunting', '/room-hunting']]) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: `एडमिन शीर्षक ${key}` })).toBeVisible();
    await expect(page.getByText('एडमिन टैगलाइन', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('एडमिन विवरण', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'संपर्क करें' }).first()).toHaveAttribute('href', '/contact');
    if (key !== 'room-hunting') await expect(page.locator('svg.page-hero-art')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});
