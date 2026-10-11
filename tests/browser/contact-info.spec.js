import { test, expect } from '@playwright/test';
import { mockApi } from './mock-api.js';

async function fillContact(page) {
  await page.getByLabel('Full name', { exact: false }).fill('Test Contact');
  await page.getByLabel('Contact number', { exact: false }).fill('+91 98765 43210');
  await page.getByRole('combobox', { name: 'Area you live in Indore' }).click();
  await page.getByPlaceholder('Search in English or Hindi…').fill('राजेंद्र');
  await page.getByRole('option', { name: 'Rajendra Nagar' }).click();
  await page.getByRole('combobox', { name: 'Native village in Nimad' }).click();
  await page.getByPlaceholder('Search in English or Hindi…').fill('not in list');
  await page.getByRole('button', { name: 'Other', exact: true }).click();
  await page.getByLabel('Enter your village', { exact: false }).fill('Custom village');
}

test('public full-screen form submits searchable and custom locations without email', async ({ page }) => {
  const calls = await mockApi(page, { 'GET /auth/me': { status: 401, body: { error: 'Unauthenticated' } }, 'POST /contact-info': { status: 201, body: { success: true, message: 'Thank you!' } } });
  await page.addInitScript(() => { localStorage.setItem('pss_lang', 'en'); sessionStorage.removeItem('nps_garba_popup_seen'); });
  await page.goto('/contact-info');
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await page.getByRole('button', { name: 'Submit details' }).click();
  await expect(page.getByRole('alert')).toHaveText('Please complete all required fields.');
  await fillContact(page);
  await page.getByRole('checkbox', { name: 'Are you a student?' }).check();
  await page.getByRole('button', { name: 'Submit details' }).click();
  await expect(page.getByRole('heading', { name: 'Thank you!' })).toBeVisible();
  expect(calls.filter(c => c.key === 'POST /contact-info').map(c => c.body)).toEqual([{
    fullName: 'Test Contact', contactNumber: '9876543210', indoreArea: 'Rajendra Nagar', nativeVillage: 'Custom village', isStudent: true, lang: 'en',
  }]);
});

test('failed submission keeps data and Hindi language switching works on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockApi(page, { 'POST /contact-info': { status: 500, body: { error: 'Unavailable' } } });
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  await page.goto('/contact-info');
  await fillContact(page);
  await page.getByRole('button', { name: 'हिंदी', exact: true }).click();
  await expect(page.getByLabel('पूरा नाम', { exact: false })).toHaveValue('Test Contact');
  await page.getByRole('button', { name: 'जानकारी जमा करें', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('आपकी जानकारी सहेजी नहीं जा सकी। कृपया फिर से प्रयास करें।');
  await expect(page.getByLabel('पूरा नाम', { exact: false })).toHaveValue('Test Contact');
  await expect(page.getByRole('combobox', { name: 'इंदौर में आपका निवास क्षेत्र' })).toContainText('राजेंद्र नगर');
});
