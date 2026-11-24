import { expect, test } from '@playwright/test';
import { ADMIN, MEMBER, mockApi } from './mock-api.js';

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
  await expect(table.getByRole('columnheader')).toHaveText(['Applicant', 'Amount', 'Application', 'Payment proof', 'Status', 'Remarks', 'Approved by', 'Review', 'Action']);
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

test('payments: the count and amount received sit beside Refresh, and Export downloads the rows of the chosen filter', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  const rows = [
    payment({ id: '1', paymentStatus: 'VERIFIED', utr: '412345678901', adminRemarks: 'Matched, "ok"', reviewedAt: '2026-11-14T06:30:00Z', reviewer: { id: 'u-admin', name: 'Ramesh Patidar' } }),
    payment({ id: '2', amount: 100, applicant: { type: 'STUDENT', name: 'Applicant 2', mobile: '9000000001', status: 'PENDING_VERIFICATION' } }),
  ];
  await mockApi(page, { 'GET /auth/me': ADMIN });
  await page.route('**/api/v1/registration-payments?*', (route) => {
    const status = new URL(route.request().url()).searchParams.get('status');
    return route.fulfill({ json: status ? rows.filter((row) => row.paymentStatus === status) : rows });
  });
  await page.goto('/admin/registration-payments');
  const header = page.locator('header').filter({ has: page.getByRole('button', { name: 'Refresh' }) });
  await expect(header.getByRole('status')).toHaveText('2 payments · Received ₹500');
  await header.getByRole('button', { name: 'Export' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('menuitem', { name: 'CSV' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('registration-payments.csv');
  const csv = (await (await import('node:fs/promises')).readFile(await file.path(), 'utf8')).replace(/^﻿/, '').split('\r\n');
  expect(csv[0]).toBe('Transaction,Date,Applicant,Mobile,Email,Type,Application,Amount,UTR,Status,Remarks,Approved by,Reviewed on,Refund amount,Refund reference');
  expect(csv[1]).toContain('TXN-1,');
  expect(csv[1]).toContain(',Applicant 1,9000000000,,Family,NPSI-APP-1,500,412345678901,Verified,"Matched, ""ok""",Ramesh Patidar,');
  expect(csv[2]).toContain(',Applicant 2,9000000001,,Student,NPSI-APP-2,100,,Awaiting review,,,');
  expect(csv).toHaveLength(3);
  // A filter narrows the count, the total and the export.
  await page.getByRole('button', { name: 'Verified', exact: true }).click();
  await expect(header.getByRole('status')).toHaveText('1 payment · Received ₹500');
  await header.getByRole('button', { name: 'Export' }).click();
  const filtered = page.waitForEvent('download');
  await page.getByRole('menuitem', { name: 'CSV' }).click();
  expect((await filtered).suggestedFilename()).toBe('registration-payments-verified.csv');
});

test('payments in Hindi: count, total and Export labels', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'hi'));
  await mockApi(page, { 'GET /auth/me': ADMIN, 'GET /registration-payments': [payment({ id: '1' }), payment({ id: '2' }), payment({ id: '3', amount: 100 })] });
  await page.goto('/admin/registration-payments');
  const header = page.locator('header').filter({ has: page.getByRole('button', { name: 'रीफ्रेश' }) });
  await expect(header.getByRole('status')).toHaveText('3 भुगतान · प्राप्त ₹0');
  await expect(header.getByRole('button', { name: 'एक्सपोर्ट' })).toBeEnabled();
});

test('super admin: Action column after Review with Edit (amount, UTR, remarks) and Delete (with confirmation)', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  const rows = [payment({ id: '1', paymentStatus: 'VERIFIED', utr: '111', applicant: { type: 'FAMILY', name: 'Applicant 1', status: 'APPROVED' } }), payment({ id: '2' })];
  const calls = await mockApi(page, {
    'GET /auth/me': ADMIN,
    'GET /registration-payments': rows,
    'PATCH /registration-payments/1': { status: 200, body: { ...rows[0], amount: 100, utr: '412345678901' } },
    'DELETE /registration-payments/1': { status: 204, body: null },
    'DELETE /registration-payments/2': { status: 409, body: { error: 'This application is still waiting for a decision. Reject the payment (or decide the application) instead of deleting it.' } },
  });
  await page.goto('/admin/registration-payments');
  const table = page.getByRole('table');
  await expect(table.getByRole('columnheader')).toHaveText(['Applicant', 'Amount', 'Application', 'Payment proof', 'Status', 'Remarks', 'Approved by', 'Review', 'Action']);
  const first = table.getByRole('row', { name: /Applicant 1/ });
  await first.getByRole('button', { name: 'Edit: Applicant 1' }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit payment' });
  await dialog.getByLabel('Amount (₹)').fill('0');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Enter an amount of at least ₹1.');
  await dialog.getByLabel('Amount (₹)').fill('100');
  await dialog.getByLabel('UTR').fill(' 412345678901 ');
  await dialog.getByLabel('Remarks').fill('Student fee');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect.poll(() => calls.find((c) => c.key === 'PATCH /registration-payments/1')?.body).toEqual({ amount: 100, utr: '412345678901', adminRemarks: 'Student fee' });
  await expect(page.getByRole('status').filter({ hasText: 'Payment updated.' })).toBeVisible();
  // Delete refused by the server: the reason shows in the dialog and nothing is removed.
  await table.getByRole('row', { name: /Applicant 2/ }).getByRole('button', { name: 'Delete: Applicant 2' }).click();
  const confirm = page.getByRole('alertdialog', { name: 'Delete this payment?' });
  await expect(confirm).toContainText('A copy is kept in the Audit Log');
  await confirm.getByRole('button', { name: 'Yes, delete' }).click();
  await expect(confirm.getByRole('alert')).toContainText('still waiting for a decision');
  await confirm.getByRole('button', { name: 'Cancel' }).click();
  await first.getByRole('button', { name: 'Delete: Applicant 1' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Yes, delete' }).click();
  await expect.poll(() => calls.some((c) => c.key === 'DELETE /registration-payments/1')).toBe(true);
  await expect(page.getByRole('status').filter({ hasText: 'Payment deleted.' })).toBeVisible();
});

test('payments staff (sub-admin) review payments but get no Edit / Delete', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  const staff = { ...MEMBER, adminAccess: { superAdmin: false, areas: ['PAYMENTS'], allVillages: true, villages: [] } };
  await mockApi(page, { 'GET /auth/me': staff, 'GET /registration-payments': [payment({ id: '1' })] });
  await page.goto('/admin/registration-payments');
  await expect(page.getByRole('columnheader', { name: 'Review' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Action' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Delete:/ })).toHaveCount(0);
});
