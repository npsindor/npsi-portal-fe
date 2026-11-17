import { expect, test } from '@playwright/test';
import { ADMIN, mockApi, NOT_LOGGED_IN } from './mock-api.js';

// Admin → Sagun Digital Cards (API mocked) and the public QR verification page.
const card = (over = {}) => ({
  profileId: 'p1', cardId: 'c1', profileCode: 'SB-2026-0001', category: 'GROOM', categoryLabel: 'युवक', name: 'रवि पाटीदार',
  rows: [{ key: 'name', label: 'युवक का नाम', value: 'रवि पाटीदार' }], photoFileId: null, state: 'APPROVED', profileStatus: 'APPROVED',
  bookletEligible: true, notEligibleReason: null, selected: false, lastPublishedAt: null, place: 'टेमला, खरगोन', submittedAt: '2026-11-01T00:00:00.000Z', reviewNotes: null, contactConsent: true, ...over,
});
const CARDS = [
  card(),
  card({ profileId: 'p2', cardId: 'c2', profileCode: 'SB-2026-0002', category: 'BRIDE', categoryLabel: 'युवती', name: 'प्रिया पाटीदार', state: 'PENDING', profileStatus: 'SUBMITTED', bookletEligible: false, notEligibleReason: 'NOT_APPROVED', contactConsent: false }),
  card({ profileId: 'p3', cardId: 'c3', profileCode: 'SB-2026-0003', name: 'अंकित पाटीदार', bookletEligible: false, notEligibleReason: 'PRIVATE_PROFILE' }),
  card({ profileId: 'p4', cardId: 'c4', profileCode: 'SB-2026-0004', name: 'सौरभ पाटीदार', selected: true, lastPublishedAt: '2026-11-10T00:00:00.000Z' }),
];
const STATS = { total: 4, grooms: 3, brides: 1, pending: 1, approved: 3, rejected: 0, inactive: 0, eligible: 2, selected: 1, published: 1, booklets: 2 };

test('admin: cards with statuses, booklet selection only for printable profiles, approve with the existing review API', async ({ page }) => {
  // Checks the desktop sidebar / header links (on phones they sit in the menu).
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  const calls = await mockApi(page, {
    'GET /auth/me': ADMIN,
    'GET /sagun-cards/stats': STATS,
    'GET /sagun-cards': CARDS,
    'PATCH /sagun-cards/selection': { updated: 1 },
    'PATCH /sagun/admin/profiles/p2/review': { ok: true },
  });
  await page.goto('/admin/sagun-cards');
  await expect(page.getByRole('heading', { name: 'Shagun Digital Cards' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Shagun Digital Cards' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /^4\s*Profiles/ })).toBeVisible();

  await page.getByRole('button', { name: 'All profiles' }).click();
  await expect(page.getByRole('listitem').filter({ hasText: 'SB-2026-0001' })).toBeVisible();
  const pending = page.getByRole('listitem').filter({ hasText: 'SB-2026-0002' });
  await expect(pending.getByText('Pending', { exact: true })).toBeVisible();
  await expect(pending.getByRole('checkbox')).toBeDisabled();
  await expect(pending.getByText('Father/mobile/DOB hidden (no consent)')).toBeVisible();
  await expect(page.getByRole('listitem').filter({ hasText: 'SB-2026-0003' }).getByText(/Not for booklet: Owner kept the profile private/)).toBeVisible();
  const published = page.getByRole('listitem').filter({ hasText: 'SB-2026-0004' });
  await expect(published.getByText('Selected for booklet')).toBeVisible();
  await expect(published.getByText('Published')).toBeVisible();

  await page.getByRole('listitem').filter({ hasText: 'SB-2026-0001' }).getByRole('checkbox').click();
  await expect.poll(() => calls.find((call) => call.key === 'PATCH /sagun-cards/selection')?.body).toEqual({ profileIds: ['p1'], selected: true });

  await pending.getByRole('button', { name: 'Approve' }).click();
  await expect.poll(() => calls.find((call) => call.key === 'PATCH /sagun/admin/profiles/p2/review')?.body).toEqual({ status: 'APPROVED', notes: '' });

  // Boys / girls tabs filter by category.
  await page.getByRole('button', { name: 'Girls', exact: true }).click();
  await expect(page.getByRole('listitem').filter({ hasText: 'SB-' })).toHaveCount(1);
});

test('admin: the booklet uses only selected printable cards and sends the chosen layout', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  const calls = await mockApi(page, {
    'GET /auth/me': ADMIN,
    'GET /sagun-cards/stats': STATS,
    'GET /sagun-cards': CARDS,
    'POST /sagun-booklets/plans': { totalProfiles: 1, totalPages: 4 },
    'POST /sagun-booklets': { status: 201, body: { id: 'b1', totalPages: 4, totalProfiles: 1, hasPdf: true, generatedAt: '2026-11-15T00:00:00.000Z' } },
  });
  page.on('dialog', (dialog) => dialog.dismiss());
  await page.goto('/admin/sagun-cards');
  await page.getByRole('button', { name: 'Printable booklet' }).click();
  await expect(page.getByText('1 selected profile will be printed')).toBeVisible();
  await page.getByLabel('4 – compact').check();
  await page.getByLabel('Index page').uncheck();
  await page.getByRole('button', { name: 'Generate & save booklet' }).click();
  // The confirmation is dismissed, so nothing is generated.
  await expect.poll(() => calls.find((call) => call.key === 'POST /sagun-booklets/plans')?.body).toMatchObject({ profileIds: ['p4'], layout: 4, includeIndex: false, includeCover: true, grouping: 'SEPARATE' });
  expect(calls.some((call) => call.key === 'POST /sagun-booklets')).toBe(false);
});

for (const lang of ['en', 'hi']) {
  test(`${lang}: public QR verification shows genuine, inactive and unknown cards without contact details`, async ({ page }) => {
    const hi = lang === 'hi';
    await page.addInitScript((value) => localStorage.setItem('pss_lang', value), lang);
    await mockApi(page, {
      'GET /auth/me': NOT_LOGGED_IN,
      'GET /sagun-cards/verifications/good-token-123456': { valid: true, profileCode: 'SB-2026-0001', name: 'रवि पाटीदार', category: 'GROOM', categoryLabel: 'युवक', place: 'टेमला, खरगोन', issuedBy: 'निमाड़ पाटीदार संगठन, इंदौर' },
      'GET /sagun-cards/verifications/old-token-1234567': { valid: false, profileCode: 'SB-2026-0002', issuedBy: 'निमाड़ पाटीदार संगठन, इंदौर' },
      'GET /sagun-cards/verifications/bad-token-1234567': { status: 404, body: { error: 'SAGUN_CARD_NOT_FOUND' } },
    });
    await page.goto('/sagun/verify/good-token-123456');
    await expect(page.getByText(hi ? 'वास्तविक और सक्रिय कार्ड' : 'Genuine and active card')).toBeVisible();
    await expect(page.getByText('रवि पाटीदार')).toBeVisible();
    await page.goto('/sagun/verify/old-token-1234567');
    await expect(page.getByText(hi ? 'यह कार्ड सक्रिय नहीं है' : 'This card is not active')).toBeVisible();
    await expect(page.getByText('SB-2026-0002')).toBeVisible();
    await page.goto('/sagun/verify/bad-token-1234567');
    await expect(page.getByText(hi ? 'कार्ड नहीं मिला' : 'Card not found')).toBeVisible();
  });
}
