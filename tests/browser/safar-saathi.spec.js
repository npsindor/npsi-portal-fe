import { test, expect } from '@playwright/test';
import { mockApi, MEMBER, NOT_LOGGED_IN } from './mock-api';

for (const lang of ['en', 'hi']) {
  test(`${lang}: backend request, private match acceptance, confirmation, completion and inbox`, async ({ page }) => {
    const hi = lang === 'hi';
    await page.setViewportSize({ width: hi ? 390 : 320, height: 900 });
    await page.addInitScript(value => localStorage.setItem('pss_lang', value), lang);
    await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /safar-saathi/capabilities': { email: true, sms: false, inApp: true } });
    const data = { profile: { name: MEMBER.fullName, email: MEMBER.email, phone: '9876500001' }, entries: [], matches: [], notices: [] };
    let posted; let partnerAccepted = false;
    await page.route('**/api/v1/safar-saathi/me', route => route.fulfill({ json: data }));
    await page.route('**/api/v1/safar-saathi/entries', async route => {
      posted = route.request().postDataJSON();
      data.entries = [{ ...posted, id: 'request-1', status: 'OPEN' }];
      data.matches = [{ id: 'match-1', status: 'PROPOSED', ownEntryId: 'request-1', acceptedByMe: false, acceptedByOther: false, origin: posted.origin, destination: posted.destination, travelDate: posted.travelDate, preferredTime: '11:00', requestType: posted.requestType, contact: null }];
      data.notices = [{ id: 'notice-1', kind: 'PROPOSED', matchId: 'match-1', emailStatus: 'SENT' }];
      await route.fulfill({ json: { id: 'request-1', matches: 1 } });
    });
    await page.route('**/api/v1/safar-saathi/matches/match-1', async route => {
      const body = route.request().postDataJSON();
      if (body.decision === 'ACCEPT') data.matches[0].acceptedByMe = true;
      if (body.decision === 'COMPLETE') { data.matches[0].status = 'COMPLETED'; data.entries[0].status = 'COMPLETED'; }
      await route.fulfill({ json: { ok: true } });
    });
    await page.goto('/transportation');
    await expect(page.locator('#safar-name')).toHaveValue(MEMBER.fullName);
    await expect(page.locator('#safar-notificationMethod option[value="SMS"]')).toHaveCount(0);
    await page.locator('#safar-origin').fill(hi ? 'इंदौर' : 'Indore');
    await page.locator('#safar-destination').fill(hi ? 'खरगोन' : 'Khargone');
    await page.locator('#safar-travelDate').fill('2099-11-29');
    await page.locator('#safar-preferredTime').fill('10:30');
    await page.locator('#safar-requestType').selectOption('DELIVERY');
    await page.locator('#safar-itemDetails').fill(hi ? 'पुस्तकें' : 'Books');
    await page.locator('#safar-notificationMethod').selectOption('EMAIL');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: hi ? 'यात्रा अनुरोध जमा करें' : 'Submit Travel Request', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('request-1');
    expect(posted).toMatchObject({ kind: 'REQUEST', requestType: 'DELIVERY', lang, phone: '9876500001', notificationMethod: 'EMAIL', consent: true });
    expect(posted.clientRequestId).toMatch(/^[0-9a-f-]{36}$/);
    await expect(page.getByRole('link', { name: '9111111111', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: hi ? 'मिलान स्वीकार करें' : 'Accept Match', exact: true }).click();
    await expect(page.getByRole('button', { name: hi ? 'दूसरे सदस्य की स्वीकृति की प्रतीक्षा है' : 'Waiting for the other member', exact: true })).toBeDisabled();
    await expect(page.getByRole('link', { name: '9111111111', exact: true })).toHaveCount(0);
    partnerAccepted = true;
    if (partnerAccepted) Object.assign(data.matches[0], { status: 'CONFIRMED', acceptedByOther: true, contact: { name: 'Test Traveller', phone: '9111111111', email: 'traveller@example.invalid', instructions: 'Test coordination note' } });
    await page.getByRole('button', { name: hi ? 'ताज़ा करें' : 'Refresh', exact: true }).click();
    await expect(page.getByRole('link', { name: '9111111111', exact: true })).toBeVisible();
    await page.getByRole('button', { name: hi ? 'पूर्ण चिह्नित करें' : 'Mark Completed', exact: true }).click();
    await expect(page.getByRole('button', { name: hi ? 'पूर्ण चिह्नित करें' : 'Mark Completed', exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: hi ? 'निजी सफ़र इनबॉक्स' : 'Private Safar Inbox', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test(`${lang}: public information is accessible, personal forms require login`, async ({ page }) => {
    const hi = lang === 'hi';
    await page.addInitScript(value => localStorage.setItem('pss_lang', value), lang);
    await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /safar-saathi/capabilities': { email: false, sms: false, inApp: true } });
    await page.goto('/transportation');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(hi ? 'साथ सफ़र करें। एक-दूसरे की मदद करें।' : 'Travel Together. Help Each Other.');
    await expect(page.locator('#safar-phone')).toHaveCount(0);
    await expect(page.locator('#safar-form').getByRole('link', { name: hi ? 'सदस्य लॉगिन' : 'Member Login', exact: true })).toHaveAttribute('href', '/login?returnTo=%2Ftransportation');
  });
}

test('unapproved membership and backend errors are localized, never saved as demo', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'hi'));
  await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /safar-saathi/capabilities': { email: false, sms: false, inApp: true }, 'GET /safar-saathi/me': { status: 403, body: { error: 'SAFAR_MEMBERSHIP_REQUIRED' } } });
  await page.goto('/transportation');
  await expect(page.getByRole('alert')).toContainText('सक्रिय और स्वीकृत सामुदायिक सदस्यता आवश्यक है');
  await expect(page.locator('#safar-phone')).toHaveCount(0);
  expect(await page.evaluate(() => Object.keys(sessionStorage).some(key => key.includes('safar')))).toBe(false);
});

test('travel offer retries retain the idempotency key and a saved plan can be cancelled', async ({ page }) => {
  await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /safar-saathi/capabilities': { email: false, sms: false, inApp: true } });
  const state = { profile: { name: MEMBER.fullName, phone: '9876500001', email: MEMBER.email }, entries: [], matches: [], notices: [] };
  await page.route('**/api/v1/safar-saathi/me', route => route.fulfill({ json: state }));
  const attempts = [];
  await page.route('**/api/v1/safar-saathi/entries', async route => {
    const payload = route.request().postDataJSON(); attempts.push(payload);
    if (attempts.length === 1) return route.fulfill({ status: 500, json: { error: 'Temporarily unavailable' } });
    state.entries.push({ ...payload, id: 'offer-1', status: 'OPEN' });
    return route.fulfill({ json: { id: 'offer-1', matches: 0 } });
  });
  await page.route('**/api/v1/safar-saathi/entries/offer-1/cancellation', async route => { state.entries[0].status = 'CANCELLED'; await route.fulfill({ json: { status: 'CANCELLED' } }); });
  await page.goto('/transportation');
  await expect(page.locator('#safar-phone')).toHaveValue('9876500001');
  await page.getByRole('button', { name: 'I Am Travelling & Can Help', exact: true }).click();
  await expect(page.locator('#safar-requestType')).toHaveValue('BOTH');
  await expect(page.locator('#safar-notificationMethod option[value="EMAIL"]')).toHaveCount(0);
  await page.locator('#safar-origin').fill('Indore');
  await page.locator('#safar-destination').fill('Khargone');
  await page.locator('#safar-travelDate').fill('2099-11-29');
  await page.locator('#safar-preferredTime').fill('11:30');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Share Travel Plan', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('We could not complete the request');
  await page.getByRole('button', { name: 'Share Travel Plan', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('offer-1');
  expect(attempts[0].clientRequestId).toBe(attempts[1].clientRequestId);
  expect(attempts[1]).toMatchObject({ kind: 'OFFER', requestType: 'BOTH', notificationMethod: 'IN_APP' });
  await page.getByRole('button', { name: 'Cancel Entry', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cancel Entry', exact: true })).toHaveCount(0);
});
