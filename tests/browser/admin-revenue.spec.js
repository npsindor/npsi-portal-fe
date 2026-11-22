import { expect, test } from '@playwright/test';
import { ADMIN, mockApi } from './mock-api.js';

// Admin dashboard and transactions: Total Revenue counts verified registration fees too (not only SUCCESS), less
// refunds actually sent; and one list failing doesn't turn every dashboard figure into 0.
const en = (page) => page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
const tx = (id, paymentStatus, amount, extra = {}) => ({ id, transactionId: `TXN-${id}`, type: 'Family Registration', amount, paymentStatus, date: '2026-11-20T00:00:00Z', ...extra });
const TXNS = [tx('1', 'SUCCESS', 500), tx('2', 'VERIFIED', 500), tx('3', 'VERIFIED', 100), tx('4', 'REFUNDED', 500, { refundAmount: 500 }), tx('5', 'SUBMITTED', 500), tx('6', 'PENDING', 500)];
const card = (page, label) => page.getByText(label, { exact: true }).locator('xpath=..');

test('dashboard Total Revenue includes verified registration fees and survives a list that fails', async ({ page }) => {
  await en(page);
  await mockApi(page, {
    'GET /auth/me': ADMIN,
    'GET /transactions': TXNS,
    'GET /families': [{ id: 'f1', familyId: 'NPSI-FAM-000001', status: 'ACTIVE' }],
    // A list this admin can't read must not zero the other figures.
    'GET /students': { status: 403, body: { error: 'Admin access required.' } },
  });
  await page.goto('/admin');
  await expect(card(page, 'Total Revenue')).toContainText('₹1,100');
  await expect(card(page, 'Total Families')).toContainText('1');
});

test('transactions page: Total Revenue and the settled count use the same rule', async ({ page }) => {
  await en(page);
  await mockApi(page, { 'GET /auth/me': ADMIN, 'GET /transactions': TXNS });
  await page.goto('/admin/transactions');
  await expect(page.getByText('₹1,100').first()).toBeVisible();
});

test('Registration payments "Received" and Transactions "Registration fees received" tally on the same data', async ({ page }) => {
  await en(page);
  const fees = [
    tx('1', 'VERIFIED', 500),
    tx('2', 'SUCCESS', 500),
    tx('3', 'VERIFIED', 100, { type: 'Student Registration' }),
    tx('4', 'REFUNDED', 500, { refundAmount: 200 }),
    tx('5', 'SUBMITTED', 500),
    tx('6', 'REJECTED', 500),
  ].map((row) => ({ ...row, applicant: { type: 'FAMILY', name: `Applicant ${row.id}` }, reviewer: null, hasScreenshot: false }));
  const event = tx('7', 'SUCCESS', 250, { type: 'Event Registration' });
  await mockApi(page, { 'GET /auth/me': ADMIN, 'GET /registration-payments': fees, 'GET /transactions': [...fees, event] });
  await page.goto('/admin/registration-payments');
  await expect(page.getByRole('status').filter({ hasText: 'payments' })).toHaveText('6 payments · Received ₹1,400');
  await page.goto('/admin/transactions');
  await expect(card(page, 'Registration fees received')).toContainText('₹1,400');
  await expect(card(page, 'Total Revenue')).toContainText('₹1,650');
});
