import { test } from '@playwright/test';
test.use({ baseURL: 'http://localhost:5173' });
const PAGES = ['/', '/about', '/events', '/community-services', '/career-business', '/news', '/sagun', '/sagun?category=bride', '/transportation', '/medical', '/room-hunting', '/public-feedback', '/contact', '/verify/NPSI-FAM-LEAKB', '/application-status',
  '/portal', '/portal/registration', '/portal/family', '/portal/events', '/portal/notifications', '/portal/settings', '/portal/feedback'];
const MARKERS = /LEAKCHECK-B|NPSI-FAM-LEAKB|9000022222|9000022223|member-b@leakcheck/;
for (const who of ['anonymous', 'member-a']) test('leak ' + who, async ({ page }) => {
  test.setTimeout(120000);
  const leaks = new Map(); const calls = new Map();
  page.on('response', async (res) => {
    if (!res.url().includes('localhost:4000/api')) return;
    const key = `${res.request().method()} ${new URL(res.url()).pathname}`;
    calls.set(key, (calls.get(key) || 0) + 1);
    try { const body = await res.text(); if (MARKERS.test(body)) leaks.set(key, body.match(MARKERS)[0]); } catch {}
  });
  if (who === 'member-a') {
    await page.goto('/login');
    await page.locator('input').first().fill('member-a@leakcheck.local');
    await page.locator('input[type="password"]').fill('LeakCheck-Pass-1');
    await page.getByRole('button', { name: /log ?in|sign in/i }).last().click();
    await page.waitForURL(/portal/, { timeout: 15000 }).catch(() => {});
  }
  for (const p of PAGES) { await page.goto(p); await page.waitForTimeout(700); }
  console.log(`\n== ${who}: API calls seen ==`); for (const [k, n] of [...calls].sort()) console.log(`  ${n}x ${k}`);
  console.log(`== ${who}: responses containing Family B data ==`); if (!leaks.size) console.log('  none'); for (const [k, m] of leaks) console.log(`  LEAK ${k}  (found "${m}")`);
});
