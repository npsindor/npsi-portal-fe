import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import { mockApi, NOT_LOGGED_IN } from './mock-api.js';

// Every image in public/advertising runs in the ad slider, in name order.
const ADS = fs.readdirSync(new URL('../../public/advertising/', import.meta.url)).filter((name) => /\.(jpe?g|png|webp|gif)$/i.test(name)).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

const EVENTS = [{ id: 'e1', status: 'PUBLISHED', title: 'Annual Sammelan', titleHi: 'वार्षिक सम्मेलन', venue: 'Indore', bannerUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="16" height="9"%3E%3Crect width="16" height="9" fill="%23c49a43"/%3E%3C/svg%3E' }];

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`landing page and showcase sliders fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
    await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /events': EVENTS });
    await page.goto('/');
    const showcase = page.locator('#showcase');
    await showcase.scrollIntoViewIfNeeded();
    await expect(showcase.getByRole('heading', { name: 'Featured on our website' })).toBeVisible();
    const text = showcase.getByRole('region', { name: 'Community highlights' });
    const media = showcase.getByRole('region', { name: 'Advertisements' });
    await expect(text).toBeVisible();
    await expect(media).toBeVisible();
    const [textBox, mediaBox] = [await text.boundingBox(), await media.boundingBox()];
    if (width >= 1024) {
      // 3 / 9 split side by side, equal heights
      expect(mediaBox.width / textBox.width).toBeGreaterThan(2.6);
      expect(Math.abs(mediaBox.height - textBox.height)).toBeLessThan(4);
    } else if (width < 768) {
      expect(mediaBox.y).toBeGreaterThan(textBox.y + textBox.height - 1); // stacked
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (process.env.SHOTS) await showcase.screenshot({ path: `${process.env.SHOTS}/showcase-${width}.png` });
  });
}

test('showcase: the ad slider shows every image in public/advertising, with the Ad label; the text slider still works', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /events': EVENTS });
  await page.goto('/');
  const showcase = page.locator('#showcase');
  await expect(showcase.getByText('Advertisements & sponsors')).toBeVisible();
  await showcase.getByRole('button', { name: 'Pause slides' }).click();
  const text = showcase.getByRole('region', { name: 'Community highlights' });
  await expect(text.getByRole('heading', { name: 'Unity, cooperation, respect and transparency' })).toBeVisible();
  await text.getByRole('button', { name: 'Next slide' }).click();
  await expect(text.getByRole('heading', { name: 'Support for every student' })).toBeVisible();
  const media = showcase.getByRole('region', { name: 'Advertisements' });
  const slides = media.locator('[aria-roledescription="slide"]');
  await expect(slides).toHaveCount(ADS.length);
  expect(await slides.locator('img').evaluateAll((imgs) => imgs.map((img) => img.getAttribute('src')))).toEqual(ADS.map((name) => `/advertising/${name}`));
  await expect(media.getByRole('img', { name: 'Advertisement 1' })).toBeVisible();
  await expect(media.getByText('Ad', { exact: true }).first()).toBeVisible();
  // The old built-in slides (logo, Garba video, latest event, join) are gone.
  await expect(media.locator('video')).toHaveCount(0);
  await expect(media.getByRole('heading')).toHaveCount(0);
  await media.getByRole('button', { name: 'Go to slide 2' }).click();
  await expect(media.getByRole('img', { name: 'Advertisement 2' })).toBeVisible();
  expect(await media.getByRole('img', { name: 'Advertisement 2' }).evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
});

test('an admin slide that uses a folder ad replaces its plain slide and adds the text and link', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  const linked = slide({ slider: 'MEDIA', mediaType: 'IMAGE', title: 'Patidar Jewellers', mediaUrl: `/advertising/${ADS[0]}`, sponsored: true, linkUrl: '/events', ctaLabel: 'Visit' });
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /home-highlights': [linked] });
  await page.goto('/');
  const media = page.locator('#showcase').getByRole('region', { name: 'Advertisements' });
  await page.locator('#showcase').getByRole('button', { name: 'Pause slides' }).click();
  await expect(media.locator('[aria-roledescription="slide"]')).toHaveCount(ADS.length);
  await expect(media.getByRole('img', { name: 'Patidar Jewellers' })).toHaveAttribute('src', `/advertising/${ADS[0]}`);
  await expect(media.getByRole('link', { name: 'Visit' })).toHaveAttribute('href', '/events');
});

const slide = (overrides) => ({ id: overrides.title, slider: 'TEXT', mediaType: 'TEXT', sponsored: false, eyebrow: null, eyebrowHi: null, titleHi: null, body: null, bodyHi: null, mediaUrl: null, linkUrl: null, ctaLabel: null, ctaLabelHi: null, startDate: null, endDate: null, sortOrder: 0, active: true, createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z', ...overrides });
const ADMIN_SLIDES = [
  slide({ title: 'Diwali Milan on 20 Nov', titleHi: 'दीपावली मिलन 20 नवंबर को', eyebrow: 'Announcement', body: 'All families are invited.', linkUrl: '/events', ctaLabel: 'See details' }),
  slide({ slider: 'MEDIA', mediaType: 'IMAGE', title: 'Patidar Jewellers', mediaUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="16" height="9"/%3E', sponsored: true, linkUrl: 'https://example.com/shop', ctaLabel: 'Visit shop' }),
  slide({ slider: 'MEDIA', mediaType: 'VIDEO', title: 'Sammelan highlights', mediaUrl: 'https://youtu.be/dQw4w9WgXcQ' }),
];

test('admin-managed slides come first, before the folder ads, in both languages, with ad labels and safe external links', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => { if (!localStorage.getItem('pss_lang')) localStorage.setItem('pss_lang', 'en'); });
  await page.route('https://www.youtube-nocookie.com/**', (route) => route.fulfill({ contentType: 'text/html', body: '<html></html>' }));
  await page.route('https://i.ytimg.com/**', (route) => route.fulfill({ status: 404, body: '' }));
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /home-highlights': ADMIN_SLIDES });
  await page.goto('/');
  const showcase = page.locator('#showcase');
  await showcase.getByRole('button', { name: 'Pause slides' }).click();
  const text = showcase.getByRole('region', { name: 'Community highlights' });
  await expect(text.getByRole('heading', { name: 'Diwali Milan on 20 Nov' })).toBeVisible();
  await expect(text.getByRole('heading', { name: 'Unity, cooperation, respect and transparency' })).toHaveCount(0);
  await expect(text.getByRole('link', { name: 'See details' })).toHaveAttribute('href', '/events');
  const media = showcase.getByRole('region', { name: 'Advertisements' });
  await expect(media.getByRole('img', { name: 'Patidar Jewellers' })).toBeVisible();
  await expect(media.getByText('Ad', { exact: true }).first()).toBeVisible();
  const shop = media.getByRole('link', { name: 'Visit shop' });
  await expect(shop).toHaveAttribute('target', '_blank');
  await expect(shop).toHaveAttribute('rel', /sponsored/);
  await expect(media.getByRole('heading', { name: 'Nimad Patidar Sangathan, Indore' })).toHaveCount(0);
  await media.getByRole('button', { name: 'Go to slide 2' }).click();
  await expect(media.locator('iframe[title="Sammelan highlights"]')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?autoplay=0/);
  await page.evaluate(() => localStorage.setItem('pss_lang', 'hi'));
  await page.reload();
  await expect(page.locator('#showcase').getByRole('heading', { name: 'दीपावली मिलन 20 नवंबर को' })).toBeVisible();
});

test('admins add highlight slides from the admin panel', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  const rows = [];
  const calls = await mockApi(page, { 'GET /auth/me': { id: 'u-admin', email: 'admin@example.com', fullName: 'Admin', phone: null, role: 'admin', photoUrl: null } });
  await page.route('**/api/v1/home-highlights', async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      const row = slide({ ...body, id: `s${rows.length + 1}` });
      rows.push(row);
      return route.fulfill({ status: 201, json: row });
    }
    return route.fulfill({ json: rows });
  });
  await page.goto('/admin/home-highlights');
  await expect(page.getByRole('heading', { name: 'Community highlights', level: 1 })).toBeVisible();
  await expect(page.getByText('No slides yet')).toBeVisible();
  await page.getByRole('tab', { name: /Media slider/ }).click();
  await page.getByRole('button', { name: 'Add slide' }).click();
  await page.getByText('Video', { exact: true }).click();
  await page.getByPlaceholder('https://youtu.be/…').fill('https://youtu.be/dQw4w9WgXcQ');
  await page.getByLabel('Advertisement / sponsored').check();
  await page.getByLabel('Title (English) *').fill('Sammelan highlights');
  await page.getByLabel('Title (Hindi)').fill('सम्मेलन की झलक');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Saved.')).toBeVisible();
  await expect(page.getByText('Sammelan highlights')).toBeVisible();
  const sent = rows[0];
  expect(sent).toMatchObject({ slider: 'MEDIA', mediaType: 'VIDEO', mediaUrl: 'https://youtu.be/dQw4w9WgXcQ', sponsored: true, title: 'Sammelan highlights', titleHi: 'सम्मेलन की झलक', startDate: null, endDate: null });
  expect(calls.length).toBeGreaterThan(0);
});
