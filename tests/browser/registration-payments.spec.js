import { expect, test } from '@playwright/test';
import { ADMIN, mockApi } from './mock-api.js';

const payment = (o) => ({ id: o.id, transactionId: `TXN-${o.id}`, type: 'Family Registration', amount: 500, paymentStatus: 'SUBMITTED', referenceId: `NPSI-APP-${o.id}`, utr: null, adminRemarks: null, reviewedAt: null, reviewer: null, hasScreenshot: false, refundAmount: null, refundReference: null, applicant: { type: 'FAMILY', name: `Applicant ${o.id}`, mobile: '9000000000', status: 'PENDING_VERIFICATION' }, ...o });

test('registration payments show the review remarks and who approved them', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  const rows = [
    payment({ id: '1', paymentStatus: 'VERIFIED', adminRemarks: 'UTR matched with bank statement', reviewedAt: '2026-11-14T06:30:00Z', reviewer: { id: 'u-admin', name: 'Ramesh Patidar' } }),
    payment({ id: '2', amount: 100, applicant: { type: 'STUDENT', name: 'Applicant 2', mobile: '9000000001', status: 'PENDING_VERIFICATION' } }),
  ];
  const calls = await mockApi(page, { 'GET /auth/me': ADMIN, 'GET /registration-payments': rows, 'POST /registration-payments/2/review': { ...rows[1], paymentStatus: 'VERIFIED' } });
  await page.goto('/admin/registration-payments');
  const table = page.getByRole('table');
  await expect(table.getByRole('columnheader')).toHaveText(['Applicant', 'Amount', 'Application', 'Payment proof', 'Status', 'Remarks', 'Approved by', 'Review']);
  const verified = table.getByRole('row', { name: /Applicant 1/ });
  await expect(verified.getByRole('cell').nth(5)).toHaveText('UTR matched with bank statement');
  await expect(verified.getByRole('cell').nth(6)).toContainText('Ramesh Patidar');
  await expect(verified.getByRole('cell').nth(6)).toContainText('2026');
  const pending = table.getByRole('row', { name: /Applicant 2/ });
  await expect(pending.getByRole('cell').nth(5)).toHaveText('—');
  await expect(pending.getByRole('cell').nth(6)).toHaveText('Not reviewed yet');
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/registration-payments.png` });
  // The remark typed while approving is what gets saved and shown.
  await pending.getByRole('button', { name: 'Review' }).click();
  await page.getByRole('dialog').getByRole('textbox').first().fill('Paid via PhonePe, verified');
  await page.getByRole('dialog').getByRole('button', { name: 'Verify payment' }).click();
  await expect.poll(() => calls.find((call) => call.key === 'POST /registration-payments/2/review')?.body).toMatchObject({ decision: 'VERIFIED', remarks: 'Paid via PhonePe, verified' });
});
