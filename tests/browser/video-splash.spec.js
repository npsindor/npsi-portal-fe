import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

// The mobile app's opening logo video (src/lib/video-splash.js), run in a plain page: it covers the screen, the
// static splash is released on its first frame, and it always ends (finished, skipped, broken video, or time limit).
const source = readFileSync(new URL('../../src/lib/video-splash.js', import.meta.url), 'utf8').replace(/^export /gm, '');
const VIDEO = readFileSync(new URL('../../public/slider/npsi-logo.mp4', import.meta.url));

const mount = async (page, options) => {
  await page.route('**/splash.mp4', (route) => route.fulfill({ contentType: 'video/mp4', body: VIDEO }));
  await page.route('**/broken.mp4', (route) => route.fulfill({ status: 404, body: '' }));
  await page.route('http://splash.test/', (route) => route.fulfill({ contentType: 'text/html', body: '<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><body><main>App</main></body>' }));
  await page.goto('http://splash.test/');
  await page.addScriptTag({ content: `${source}\nwindow.mountVideoSplash = mountVideoSplash;` });
  return page.evaluate((opts) => {
    window.firstFrame = 0;
    window.splashResult = window.mountVideoSplash({ ...opts, onFirstFrame: () => { window.firstFrame += 1; } });
  }, options);
};

test('the logo video covers the screen, plays muted, and Skip ends it', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await mount(page, { src: '/splash.mp4', skipLabel: 'आगे बढ़ें', skipAfterMs: 200 });
  const overlay = page.locator('#video-splash');
  await expect(overlay).toBeVisible();
  expect(await overlay.boundingBox()).toEqual({ x: 0, y: 0, width: 412, height: 915 });
  expect(await overlay.locator('video').evaluate((v) => [v.muted, v.playsInline, v.getAttribute('src')])).toEqual([true, true, '/splash.mp4']);
  await page.getByRole('button', { name: 'आगे बढ़ें' }).click();
  await expect(overlay).toHaveCount(0);
  expect(await page.evaluate(() => window.splashResult)).toBe('skipped');
  expect(await page.evaluate(() => window.firstFrame)).toBe(1);
});

test('a video that cannot load never blocks the app', async ({ page }) => {
  await mount(page, { src: '/broken.mp4' });
  await expect(page.locator('#video-splash')).toHaveCount(0);
  expect(await page.evaluate(() => window.splashResult)).toBe('error');
  expect(await page.evaluate(() => window.firstFrame)).toBe(1);
});

test('the time limit ends it even if the video never finishes', async ({ page }) => {
  await mount(page, { src: '/splash.mp4', maxMs: 300 });
  await expect(page.locator('#video-splash')).toHaveCount(0);
  expect(['timeout', 'ended']).toContain(await page.evaluate(() => window.splashResult));
});
