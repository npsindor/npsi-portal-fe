import { expect, test } from '@playwright/test';
import * as XLSX from 'xlsx';
import { ADMIN, mockApi } from './mock-api.js';

const workbookFile = () => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
    ['Total Expense', null, 130000],
    [null, 'Tent & Decoration', null, 50000],
    [null, 'Music System', null, 25000],
  ]), 'hisab final-');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
    ['माँ ना गरबा सहयोगकर्ता सूची'],
    ['Rank', 'Name', 'Cash Amount', 'QR Amount', 'Village', 'Collected By'],
    [1, 'Smt. Asha Patidar', 2500, null, 'Indore', 'Collector One'],
    [2, 'Shri Raj Patidar', 1000, null, 'Sanawad', 'Collector Two'],
  ]), 'Sheet15');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

test('finance spreadsheet suggestions stay local and prefill matching villages', async ({ page }) => {
  const calls = await mockApi(page, {
    'GET /auth/me': ADMIN,
    'GET /event-finance': [{ id: 'event-1', title: 'Garba Night', date: '2026-12-01', status: 'PUBLISHED', venue: 'Hall' }],
    'GET /event-finance/admin/categories': [{ id: 'category-1', name: 'Decoration', active: true, sortOrder: 0 }],
    'GET /event-finance/event-1': {
      event: { id: 'event-1', title: 'Garba Night', date: '2026-12-01', status: 'PUBLISHED', venue: 'Hall' },
      summary: { totalCollection: 0, totalExpenses: 0, remainingBalance: 0, pendingContributions: 0, pendingExpenses: 0 },
      contributions: [],
      expenses: [],
      villages: [],
      categoryTotals: [],
    },
    'GET /event-finance/admin/events/event-1/roster': { members: [], teams: [] },
  });

  await page.goto('/admin/event-finance');
  await expect(page.getByRole('heading', { name: /Event Management.*Finance & Roster/ })).toBeVisible();
  await page.locator('#finance-suggestions-file').setInputFiles({
    name: 'npsiportal.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: workbookFile(),
  });
  await expect(page.getByRole('status')).toContainText('2 contributors · 2 expense titles ready');

  await page.getByRole('button', { name: 'Contributions', exact: true }).click();
  await expect(page.locator('#finance-contributor-names option')).toHaveCount(2);
  await page.getByLabel('Member name').fill('Smt. Asha Patidar');
  await expect(page.getByLabel('Village')).toHaveValue('Indore');
  await page.getByRole('button', { name: 'Expenses', exact: true }).click();
  await expect(page.locator('#finance-expense-title-suggestions option')).toHaveCount(2);
  await page.getByLabel('Expense title').fill('Tent');
  await expect(page.getByLabel('Expense title')).toHaveAttribute('list', 'finance-expense-title-suggestions');

  expect(calls.some(call => call.key.includes('/roster/import'))).toBe(false);
  expect(calls.some(call => call.key.startsWith('POST /event-finance/'))).toBe(false);
});
