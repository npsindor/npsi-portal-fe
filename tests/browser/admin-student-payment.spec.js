import { expect, test } from '@playwright/test';
import { ADMIN, mockApi } from './mock-api.js';

// Student Management: the ₹100 registration fee is shown and reviewed with the application, and Approve stays off
// until the fee is verified (the same rule as family applications); older applications without a fee are not held back.
const en = (page) => page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
const payment = (fields) => ({ id: 'txn-1', transactionId: 'TXN-000041', amount: 100, status: 'SUBMITTED', utr: '412345678901', hasScreenshot: true, adminRemarks: null, ...fields });
const application = (fields) => ({
  id: 'sa1', applicationId: 'NPSI-STU-APP-2026-000017', status: 'PENDING_VERIFICATION', studentName: 'Riya Patidar', mobile: '9876500002',
  email: 'riya@example.com', course: 'B.Sc.', submittedDate: '2026-11-16T08:39:51.000Z', payment: payment(), ...fields,
});
const drawer = (page) => page.locator('.fixed.inset-0').filter({ hasText: 'NPSI-STU-APP-2026-000017' });

test('a submitted fee: screenshot and UTR in the review, Approve off until the payment is verified', async ({ page }) => {
  await en(page);
  const calls = await mockApi(page, {
    'GET /auth/me': ADMIN,
    'GET /student-applications': [application()],
    'POST /registration-payments/txn-1/review': { id: 'txn-1', paymentStatus: 'VERIFIED' },
    'POST /student-applications/sa1/review': { application: application({ status: 'APPROVED' }), student: { studentId: 'NPSI-STU-000009' } },
  });
  let proofOpened = false;
  await page.route('**/api/v1/registration-payments/txn-1/screenshot', (route) => {
    proofOpened = true;
    return route.fulfill({ contentType: 'image/png', body: Buffer.from('89504e470d0a1a0a', 'hex') });
  });
  await page.goto('/admin/students');
  const row = page.getByRole('row', { name: /NPSI-STU-APP-2026-000017/ });
  await expect(row).toContainText('₹100 · Proof submitted');
  await row.getByRole('button', { name: 'Review' }).click();
  const review = drawer(page);
  const fee = review.getByRole('region', { name: 'Registration fee' });
  await expect(fee).toContainText('TXN-000041 · UTR: 412345678901');
  await expect(review.getByText('Verify the ₹100 payment before approving this application.')).toBeVisible();
  await expect(review.getByRole('button', { name: 'Approve' })).toBeDisabled();

  const popup = page.waitForEvent('popup');
  await fee.getByRole('button', { name: 'View payment screenshot' }).click();
  await (await popup).close();
  await expect.poll(() => proofOpened).toBe(true);

  await fee.getByRole('button', { name: 'Verify payment' }).click();
  await expect.poll(() => calls.find((call) => call.key === 'POST /registration-payments/txn-1/review')?.body).toEqual({ decision: 'VERIFIED', lang: 'en' });
  await expect(fee).toContainText('₹100 · Verified');
  await expect(row).toContainText('₹100 · Verified');
  await review.getByRole('button', { name: 'Approve' }).click();
  await review.getByRole('button', { name: /Confirm Approve/ }).click();
  await expect.poll(() => calls.find((call) => call.key === 'POST /student-applications/sa1/review')?.body).toMatchObject({ decision: 'APPROVED' });
});

test('rejecting the payment needs a reason; a pending fee without a screenshot says to check the UPI statement', async ({ page }) => {
  await en(page);
  const calls = await mockApi(page, {
    'GET /auth/me': ADMIN,
    'GET /student-applications': [application({ payment: payment({ status: 'PENDING', utr: null, hasScreenshot: false }) })],
    'POST /registration-payments/txn-1/review': { id: 'txn-1', paymentStatus: 'REJECTED' },
  });
  await page.goto('/admin/students');
  await page.getByRole('row', { name: /NPSI-STU-APP-2026-000017/ }).getByRole('button', { name: 'Review' }).click();
  const fee = drawer(page).getByRole('region', { name: 'Registration fee' });
  await expect(fee).toContainText('No screenshot uploaded. Match the payment with the UPI account statement.');
  await fee.getByRole('button', { name: 'Reject payment' }).click();
  await fee.getByRole('button', { name: /Confirm Reject payment/ }).click();
  await expect(page.getByText('Enter the reason for rejecting the payment.').first()).toBeVisible();
  expect(calls.some((call) => call.key === 'POST /registration-payments/txn-1/review')).toBe(false);
  await fee.getByLabel('Reason for rejecting the payment').fill('No such UPI credit');
  await fee.getByRole('button', { name: /Confirm Reject payment/ }).click();
  await expect.poll(() => calls.find((call) => call.key === 'POST /registration-payments/txn-1/review')?.body).toEqual({ decision: 'REJECTED', remarks: 'No such UPI credit', lang: 'en' });
  await expect(fee).toContainText('₹100 · Rejected');
  await expect(drawer(page).getByRole('button', { name: 'Approve' })).toBeDisabled();
});

test('an older application without a fee record can still be approved; Hindi labels', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'hi'));
  await mockApi(page, { 'GET /auth/me': ADMIN, 'GET /student-applications': [application({ payment: null })] });
  await page.goto('/admin/students');
  const row = page.getByRole('row', { name: /NPSI-STU-APP-2026-000017/ });
  await expect(row).toContainText('शुल्क दर्ज नहीं');
  await row.getByRole('button', { name: 'समीक्षा' }).click();
  await expect(drawer(page).getByRole('button', { name: 'स्वीकृत करें', exact: true })).toBeEnabled();
});
