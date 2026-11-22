import { test, expect } from '@playwright/test';
import { MEMBER, mockApi } from './mock-api';

test('family registration guides the user through validation, payment proof, and submission', async ({ page }) => {
  const calls = await mockApi(page, {
    'GET /auth/me': MEMBER,
    'GET /me/registrations': { registrations: [], completion: { percent: 50, missing: ['Family registration'] } },
    'POST /me/payment-screenshots': { fileId: 'payment-shot-1' },
    'POST /me/registrations': { applicationId: 'NPSI-APP-TEST-1' },
  });

  await page.goto('/portal/registration');
  await expect(page.getByText(/50%/)).toBeVisible();

  await expect(page.locator('#reg-first')).toHaveAttribute('autocomplete', 'given-name');
  await expect(page.locator('#reg-last')).toHaveAttribute('autocomplete', 'family-name');
  await expect(page.locator('#reg-dob')).toHaveAttribute('max', /\d{4}-\d{2}-\d{2}/);
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.locator('#reg-first')).toHaveJSProperty('validity.valueMissing', true);
  await page.locator('#reg-first').fill('Test');
  await page.locator('#reg-last').fill('Member');
  await page.locator('#reg-gender').selectOption('Female');
  await page.locator('#reg-dob').fill('1995-01-01');
  // Marital status is asked of the family head; without it the step doesn't move on.
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.locator('#reg-marital')).toHaveJSProperty('validity.valueMissing', true);
  await expect(page.locator('#reg-education')).toHaveCount(0);
  await page.locator('#reg-marital').selectOption('UNMARRIED');
  await page.getByRole('button', { name: 'Next' }).click();

  await page.locator('#reg-area').fill('Vijay Nagar');
  await page.locator('#reg-address').fill('100 Test Road');
  await expect(page.locator('#reg-address')).toHaveAttribute('autocomplete', 'street-address');
  await page.locator('#reg-pincode').fill('452010');
  await page.locator('#reg-village').fill('Test Village');
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page.getByRole('heading', { name: /Member Registration.*₹500/ })).toBeVisible();
  await expect(page.getByRole('img', { name: /UPI QR/ })).toBeVisible();
  await page.locator('#reg-screenshot').setInputFiles({ name: 'payment.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9kAAAAASUVORK5CYII=', 'base64') });
  await expect.poll(() => calls.some(call => call.key === 'POST /me/payment-screenshots')).toBe(true);
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Marital status', { exact: true })).toBeVisible();
  await expect(page.getByText('Unmarried', { exact: true })).toBeVisible();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByRole('status')).toContainText('NPSI-APP-TEST-1');
  const submission = calls.find(call => call.key === 'POST /me/registrations');
  expect(submission.body).toMatchObject({ type: 'FAMILY', firstName: 'Test', lastName: 'Member', maritalStatus: 'UNMARRIED', screenshotFileId: 'payment-shot-1' });
  expect(submission.body).not.toHaveProperty('education');
});
