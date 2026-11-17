import { expect, test } from '@playwright/test';
import { ADMIN, MEMBER, mockApi } from './mock-api.js';

// A small statement in the shape of the imported Maa Na Garba roster: two contribution sections, two expense sections.
const EVENT = { id: 'ev-garba', title: 'Navratri Garba Mahotsav 2026', titleHi: 'माँ ना गरबा महोत्सव 2026', date: '2026-10-12', venue: 'Indore', status: 'PUBLISHED' };
const c = (serialNo, memberName, village, amount, extra = {}) => ({ id: `c-${extra.contributionGroup || 'GENERAL'}-${serialNo}`, serialNo, memberName, village, amount, contributionGroup: 'GENERAL', status: 'APPROVED', paymentMode: 'CASH', contributedAt: '2026-10-12T00:00:00.000Z', ...extra });
const CONTRIBUTIONS = [
  c(1, 'Smt. Mamata Gajanand ji Patidar', 'Indore', 21000),
  c(7, 'Smt. Sonu Manish Patidar', 'Gheghav', 82000),
  c(13, 'Shri Moksh Patidar (मिकी माउस सहयोग राशि )', 'Rajur', 27100),
  c(43, 'Smt. Archana Lakhan Patidar', 'Gheghav', 5100, { status: 'PENDING', reviewNote: "Source statement shows the amount as '51,00'." }),
  c(1, 'Shri Kamal Ji Patidar (Ice-cream)', 'Rampura', 18500, { contributionGroup: 'BHOG_PRASAD' }),
];
const e = (serialNo, expenseGroup, title, titleHi, amount) => ({ id: `e-${expenseGroup}-${serialNo}`, serialNo, expenseGroup, title, titleHi, description: `${title} details`, descriptionHi: `${titleHi} विवरण`, amount, status: 'APPROVED', category: { id: 'cat', name: 'Misc', nameHi: 'विविध' } });
const EXPENSES = [e(1, 'EVENT', 'Publicity & Welcome Decoration', 'प्रचार-प्रसार एवं स्वागत सज्जा', 84781), e(1, 'ORGANIZATION', 'Swajan Samaroh', 'स्वजन समारोह', 50000)];
const summary = { totalCollection: 148600, totalExpenses: 134781, remainingBalance: 13819, pendingContributions: 5100, pendingContributionCount: 1, pendingExpenses: 0, pendingExpenseCount: 0, contributorCount: 4, villageCount: 4, contributionGroups: { GENERAL: 130100, BHOG_PRASAD: 18500 }, expenseGroups: { EVENT: 84781, ORGANIZATION: 50000 } };
const detail = (admin) => ({ event: EVENT, summary, contributions: admin ? CONTRIBUTIONS : CONTRIBUTIONS.filter((row) => row.status === 'APPROVED').map(({ reviewNote: _r, ...row }) => row), expenses: EXPENSES, categoryTotals: [], villages: [], canManage: admin });

test('member: bilingual statement with totals from the records, section subtotals, filters and the expense sections', async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('pss_lang')) localStorage.setItem('pss_lang', 'en'); });
  await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /me/family': { family: { familyId: 'NPSI-FAM-1', status: 'ACTIVE' }, members: [] }, 'GET /event-finance': [{ ...EVENT, ...summary }], 'GET /event-finance/ev-garba': detail(false) });
  await page.goto('/portal/event-kharcha');
  await page.locator('tr', { hasText: 'Navratri Garba' }).getByRole('button').click();
  const sum = page.getByRole('region', { name: 'Financial summary' });
  await expect(sum).toContainText('₹1,48,600');
  await expect(sum).toContainText('₹1,34,781');
  await expect(sum).toContainText('₹13,819');
  const list = page.getByRole('region', { name: 'Contributions received (Aavak)' });
  await expect(list.getByRole('columnheader', { name: 'Sahyog Rashi' })).toBeVisible();
  await expect(list.getByRole('columnheader', { name: "Mataji's Bhog & Prasad Sahyog" })).toBeVisible();
  await expect(list.getByText('Smt. Archana Lakhan Patidar')).toHaveCount(0); // pending: members never see it
  await expect(list.getByText('Shri Moksh Patidar (मिकी माउस सहयोग राशि )')).toBeVisible(); // name kept as printed
  await list.getByLabel('Village / location').selectOption('Gheghav');
  await expect(list.getByRole('status')).toContainText('Showing 1 of 4');
  await list.getByRole('button', { name: 'Clear filters' }).click();
  await list.getByLabel('Sort by').selectOption('amountDesc');
  await expect(list.locator('tbody tr').first()).toContainText('Smt. Sonu Manish Patidar');
  await page.getByRole('tab', { name: 'Event expenses (Jaavak)' }).click();
  const exp = page.getByRole('region', { name: 'Event expenses (Jaavak)' });
  await expect(exp.getByRole('columnheader', { name: 'Swajan Samaroh – Nimar Patidar Sangathan, Indore' })).toBeVisible();
  await expect(exp).toContainText('Subtotal: Maa Na Garba Mahotsav expenses');
  // Hindi: headings, the event's Hindi title and the Hindi expense heading.
  await page.evaluate(() => localStorage.setItem('pss_lang', 'hi'));
  await page.reload();
  await page.locator('tr', { hasText: 'माँ ना गरबा' }).getByRole('button').click();
  await expect(page.getByRole('region', { name: 'वित्तीय सारांश' })).toContainText('कुल सहयोग राशि (आवक)');
  await page.getByRole('tab', { name: 'आयोजन व्यय (जावक)' }).click();
  await expect(page.getByRole('cell', { name: /^प्रचार-प्रसार एवं स्वागत सज्जा/ }).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('admin: pending entries are flagged with their review note and excluded from totals; a report opens print-ready', async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  await mockApi(page, {
    'GET /auth/me': ADMIN,
    'GET /event-finance': [{ ...EVENT, ...summary }],
    'GET /event-finance/admin/categories': [{ id: 'cat', name: 'Misc', nameHi: 'विविध', active: true, sortOrder: 0 }],
    'GET /event-finance/ev-garba': detail(true),
    'GET /event-finance/admin/events/ev-garba/roster': { members: [], teams: [], assignments: [], stats: {} },
    'GET /event-finance/admin/events/ev-garba/history': [{ id: 'a1', eventId: 'ev-garba', actorId: 'u-admin', actorName: 'Super Admin', entityType: 'CONTRIBUTION', entityId: 'c-GENERAL-43', action: 'IMPORT', before: null, after: { memberName: 'Smt. Archana Lakhan Patidar', amount: '5100', status: 'PENDING' }, createdAt: '2026-11-17T10:00:00.000Z' }],
  });
  await page.goto('/admin/event-finance');
  await expect(page.getByRole('region', { name: 'Financial summary' })).toContainText('1 contributions (₹5,100) are waiting for review');
  await page.getByRole('button', { name: 'Contributions', exact: true }).click();
  const list = page.getByRole('region', { name: 'Contributions received (Aavak)' });
  await expect(list.getByText('Check', { exact: true })).toBeVisible();
  await expect(list.getByText("Source statement shows the amount as '51,00'.")).toBeVisible();
  await list.getByLabel('Status').selectOption('PENDING');
  await expect(list.getByRole('status')).toContainText('Showing 1 of 5');
  await list.getByRole('row', { name: /Archana Lakhan/ }).getByRole('button', { name: 'History' }).click();
  await expect(page.getByText('Imported from statement')).toBeVisible();
  await expect(page.getByText('Super Admin')).toBeVisible();
  await page.getByRole('button', { name: 'Reports / Excel' }).click();
  const [report] = await Promise.all([context.waitForEvent('page'), page.getByRole('button', { name: 'Full financial summary' }).first().click()]);
  await report.waitForLoadState();
  await expect(report.locator('body')).toContainText('Complete Financial Summary');
  await expect(report.locator('body')).toContainText('₹13,819');
});
