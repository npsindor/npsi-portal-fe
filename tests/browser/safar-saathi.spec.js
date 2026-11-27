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
    await page.goto('/travel-assistance');
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
    await expect(page.getByRole('link', { name: /9111111111/ })).toHaveCount(0);
    await page.getByRole('button', { name: hi ? 'मिलान स्वीकार करें' : 'Accept Match', exact: true }).click();
    await expect(page.getByRole('button', { name: hi ? 'दूसरे सदस्य की स्वीकृति की प्रतीक्षा है' : 'Waiting for the other member', exact: true })).toBeDisabled();
    await expect(page.getByRole('link', { name: /9111111111/ })).toHaveCount(0);
    partnerAccepted = true;
    if (partnerAccepted) Object.assign(data.matches[0], { status: 'CONFIRMED', acceptedByOther: true, contact: { name: 'Test Traveller', phone: '9111111111', email: 'traveller@example.invalid', instructions: 'Test coordination note' } });
    await page.getByRole('button', { name: hi ? 'ताज़ा करें' : 'Refresh', exact: true }).click();
    await expect(page.getByRole('link', { name: `${hi ? 'कॉल करें' : 'Call'} 9111111111`, exact: true })).toHaveAttribute('href', 'tel:9111111111');
    await page.getByRole('button', { name: hi ? 'पूर्ण चिह्नित करें' : 'Mark Completed', exact: true }).click();
    await expect(page.getByRole('button', { name: hi ? 'पूर्ण चिह्नित करें' : 'Mark Completed', exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: hi ? 'निजी सफ़र इनबॉक्स' : 'Private Safar Inbox', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test(`${lang}: public information is accessible, personal forms require login`, async ({ page }) => {
    const hi = lang === 'hi';
    await page.addInitScript(value => localStorage.setItem('pss_lang', value), lang);
    await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /safar-saathi/capabilities': { email: false, sms: false, inApp: true } });
    await page.goto('/travel-assistance');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(hi ? 'साथ सफ़र करें। एक-दूसरे की मदद करें।' : 'Travel Together. Help Each Other.');
    await expect(page.locator('#safar-phone')).toHaveCount(0);
    await expect(page.locator('#safar-form').getByRole('link', { name: hi ? 'सदस्य लॉगिन' : 'Member Login', exact: true })).toHaveAttribute('href', '/login?returnTo=%2Ftravel-assistance');
  });
}

test('unapproved membership and backend errors are localized, never saved as demo', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'hi'));
  await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /safar-saathi/capabilities': { email: false, sms: false, inApp: true }, 'GET /safar-saathi/me': { status: 403, body: { error: 'SAFAR_MEMBERSHIP_REQUIRED' } } });
  await page.goto('/travel-assistance');
  await expect(page.getByRole('alert')).toContainText('यात्रा एवं सहायता के लिए आवेदन करने हेतु कृपया पहले');
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
  await page.goto('/travel-assistance');
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

test('the old /transportation address opens Travel & Assistance at the same section', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /safar-saathi/capabilities': { email: false, sms: false, inApp: true } });
  await page.goto('/transportation#safar-form');
  await expect(page).toHaveURL(/\/travel-assistance#safar-form$/);
  // Menu, footer and search all link the new address; nothing links the old one.
  await expect(page.locator('a[href="/travel-assistance"]').first()).toBeAttached();
  await expect(page.locator('a[href="/transportation"]')).toHaveCount(0);
  await expect(page).toHaveTitle(/Travel & Assistance/);
});

const SAFAR_ME = (fields) => ({ profile: { name: MEMBER.fullName, phone: '9876500001', email: MEMBER.email }, entries: [], matches: [], notices: [], ownPairs: 0, ...fields });
const match = (fields) => ({
  id: 'm1', status: 'PROPOSED', ownEntryId: 'plan-1', acceptedByMe: false, acceptedByOther: false, ownKind: 'OFFER', otherKind: 'REQUEST',
  ownRoute: { origin: 'Indore', destination: 'Khargone', travelDate: '2099-11-29T00:00:00.000Z', preferredTime: '19:00' }, minutesApart: 0,
  origin: 'Indore', destination: 'Khargone', travelDate: '2099-11-29T00:00:00.000Z', preferredTime: '19:00', requestType: 'DELIVERY', contact: null, ...fields,
});

test('Potential Matches: the Indore → Khargone parcel request shows type, side, route, date, time and status; old ones fold away', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  await mockApi(page, {
    'GET /auth/me': MEMBER,
    'GET /safar-saathi/capabilities': { email: false, sms: false, inApp: true },
    'GET /safar-saathi/me': SAFAR_ME({
      matches: [
        match({}),
        match({ id: 'm2', requestType: 'TRAVEL', minutesApart: 90, preferredTime: '20:30' }),
        match({ id: 'm3', status: 'CANCELLED', origin: 'Indore', destination: 'Khandwa' }),
      ],
    }),
  });
  await page.goto('/travel-assistance');
  const cards = page.getByTestId('safar-match');
  await expect(cards).toHaveCount(3);
  const parcel = cards.nth(0);
  await expect(parcel).toContainText('Parcel delivery');
  await expect(parcel).toContainText('Potential Match');
  await expect(parcel).toContainText('Their request');
  await expect(parcel.getByRole('heading', { name: 'Indore → Khargone' })).toBeVisible();
  await expect(parcel).toContainText('29 November 2099 · 19:00');
  await expect(parcel).toContainText('Your travel plan: 19:00 · Same time');
  await expect(parcel.getByRole('button', { name: 'Accept Match' })).toBeVisible();
  await expect(cards.nth(1)).toContainText('Travelling together');
  await expect(cards.nth(1)).toContainText('1 h 30 min apart');
  // A cancelled match is not shown as active: it sits, closed, under "Earlier matches".
  await expect(cards.nth(2)).toBeHidden();
  await page.getByText('Earlier matches (1)').click();
  await expect(cards.nth(2)).toContainText('Cancelled');
  await expect(cards.nth(2).getByRole('button')).toHaveCount(0);
  await expect(page.getByText('No possible matches yet.')).toHaveCount(0);
});

test('Potential Matches: no match keeps the empty message; own plan + own request explains why (Hindi too)', async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('pss_lang')) localStorage.setItem('pss_lang', 'en'); });
  const me = SAFAR_ME({ ownPairs: 1, matches: [match({ status: 'DECLINED' })] });
  await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /safar-saathi/capabilities': { email: false, sms: false, inApp: true }, 'GET /safar-saathi/me': me });
  await page.goto('/travel-assistance');
  await expect(page.getByText('No possible matches yet. We will check when a compatible request or travel plan is submitted.')).toBeVisible();
  await expect(page.getByRole('note').filter({ hasText: 'cannot be matched with each other' })).toBeVisible();
  await page.evaluate(() => localStorage.setItem('pss_lang', 'hi'));
  await page.reload();
  await expect(page.getByRole('note').filter({ hasText: 'आपस में मिलान नहीं हो सकता' })).toBeVisible();
  await expect(page.getByText('पिछले मिलान (1)')).toBeVisible();
});

// ---- Available Journeys & Requests ----
const JOURNEY = (fields) => ({ id: 'plan-1', kind: 'OFFER', requestType: 'BOTH', origin: 'Indore', destination: 'Khargone', travelDate: '2099-11-29', preferredTime: '19:00', itemDetails: null, status: 'OPEN', minutesFromWanted: null, connection: null, ...fields });

test('Available Journeys: a member who posted nothing browses plans and requests and sends a parcel request from a plan', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  let available = { matchWindowHours: 12, items: [
    JOURNEY({}),
    JOURNEY({ id: 'plan-2', requestType: 'TRAVEL', destination: 'Maheshwar', preferredTime: '08:00' }),
    JOURNEY({ id: 'need-1', kind: 'REQUEST', requestType: 'DELIVERY', destination: 'Barwaha', itemDetails: 'Sweets box' }),
  ] };
  const calls = await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /safar-saathi/capabilities': { email: false, sms: false, inApp: true }, 'GET /safar-saathi/me': SAFAR_ME({}) });
  await page.route('**/api/v1/safar-saathi/available*', (route) => route.fulfill({ json: available }));
  let sent;
  await page.route('**/api/v1/safar-saathi/entries/plan-1/connections', async (route) => {
    sent = route.request().postDataJSON();
    available = { ...available, items: available.items.map((item) => (item.id === 'plan-1' ? { ...item, connection: { matchId: 'm9', status: 'PROPOSED' } } : item)) };
    await route.fulfill({ status: 201, json: { entryId: 'mine-1', matchId: 'm9', existing: false } });
  });
  await page.goto('/travel-assistance');
  const cards = page.getByTestId('safar-available');
  await expect(cards).toHaveCount(3);
  // Plan carrying both: both requests; travel-only plan: travel together only; a member's request: offer to help.
  await expect(cards.nth(0).getByRole('button', { name: /Request Parcel Delivery/ })).toBeVisible();
  await expect(cards.nth(0).getByRole('button', { name: /Request to Travel Together/ })).toBeVisible();
  await expect(cards.nth(1).getByRole('button', { name: /Request Parcel Delivery/ })).toHaveCount(0);
  await expect(cards.nth(1).getByRole('button', { name: /Request to Travel Together/ })).toBeVisible();
  await expect(cards.nth(2)).toContainText('Parcel request');
  await expect(cards.nth(2)).toContainText('Sweets box');
  await expect(cards.nth(2).getByRole('button', { name: /Offer to Help/ })).toBeVisible();
  await expect(cards.nth(0)).toContainText('29 November 2099 · Departure 19:00');
  // No names or phone numbers in the list.
  await expect(page.locator('#safar-available')).not.toContainText(/\d{10}/);
  await cards.nth(0).getByRole('button', { name: /Request Parcel Delivery/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Request Parcel Delivery' })).toBeVisible();
  await expect(dialog.locator('#connect-time')).toHaveValue('19:00');
  await dialog.locator('#connect-item').fill('Medicine box');
  await dialog.locator('#connect-time').fill('17:30');
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Send Request' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Request sent.' })).toBeVisible();
  expect(sent).toMatchObject({ requestType: 'DELIVERY', itemDetails: 'Medicine box', preferredTime: '17:30', lang: 'en', consent: true });
  expect(sent.clientRequestId).toMatch(/^[0-9a-f-]{36}$/);
  // After sending: the card shows the request instead of the buttons, so a second one is not sent.
  await expect(cards.nth(0).getByRole('link', { name: 'Request sent' })).toHaveAttribute('href', '#safar-matches');
  await expect(cards.nth(0).getByRole('button', { name: /Request Parcel Delivery/ })).toHaveCount(0);
  expect(calls.filter((call) => call.key === 'GET /safar-saathi/me').length).toBeGreaterThan(1);
});

test('Available Journeys: route/date/time search ranks within the 12-hour window; travel-together and offer-to-help forms', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /safar-saathi/capabilities': { email: false, sms: false, inApp: true }, 'GET /safar-saathi/me': SAFAR_ME({}) });
  const queries = [];
  await page.route('**/api/v1/safar-saathi/available*', (route) => {
    const url = new URL(route.request().url());
    queries.push(url.search);
    route.fulfill({ json: { matchWindowHours: 12, items: url.search ? [JOURNEY({ minutesFromWanted: 90 }), JOURNEY({ id: 'need-2', kind: 'REQUEST', requestType: 'TRAVEL', minutesFromWanted: 360 })] : [] } });
  });
  const posted = {};
  await page.route('**/api/v1/safar-saathi/entries/*/connections', async (route) => {
    posted[route.request().url().split('/').at(-2)] = route.request().postDataJSON();
    await route.fulfill({ status: 201, json: { entryId: 'x', matchId: 'y', existing: false } });
  });
  await page.goto('/travel-assistance');
  await expect(page.getByText('No open journeys or requests from other members right now.')).toBeVisible();
  await page.locator('#available-origin').fill('Indore');
  await page.locator('#available-destination').fill('Khargone');
  await page.locator('#available-date').fill('2099-11-29');
  await page.locator('#available-time').fill('17:30');
  await page.locator('#safar-available').getByRole('button', { name: 'Search' }).click();
  await expect.poll(() => queries.at(-1)).toBe('?origin=Indore&destination=Khargone&date=2099-11-29&time=17%3A30');
  await expect(page.getByText('Showing this route within the 12-hour matching window, closest first.')).toBeVisible();
  const cards = page.getByTestId('safar-available');
  await expect(cards.nth(0)).toContainText('1 h 30 min apart from your time · Within 12-hour matching window');
  await cards.nth(0).getByRole('button', { name: /Request to Travel Together/ }).click();
  await page.getByRole('dialog').getByRole('checkbox').check();
  await page.getByRole('dialog').getByRole('button', { name: 'Send Request' }).click();
  await expect.poll(() => posted['plan-1']).toMatchObject({ requestType: 'TRAVEL', preferredTime: '19:00' });
  await cards.nth(1).getByRole('button', { name: /Offer to Help/ }).click();
  await expect(page.getByRole('dialog').locator('#connect-item')).toHaveCount(0);
  await page.getByRole('dialog').getByRole('checkbox').check();
  await page.getByRole('dialog').getByRole('button', { name: 'Send Request' }).click();
  await expect.poll(() => posted['need-2']).toBeTruthy();
  expect(posted['need-2'].requestType).toBeUndefined();
  await page.getByRole('button', { name: 'Show all' }).click();
  await expect.poll(() => queries.at(-1)).toBe('');
});

test('Potential Matches: a direct request is marked, with their time and your time shown separately', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  await mockApi(page, {
    'GET /auth/me': MEMBER,
    'GET /safar-saathi/capabilities': { email: false, sms: false, inApp: true },
    'GET /safar-saathi/me': SAFAR_ME({ matchWindowHours: 12, matches: [match({ direction: 'RECEIVED', requestType: 'TRAVEL', travelDate: '2099-11-30T00:00:00.000Z', preferredTime: '05:00', minutesApart: 360, ownRoute: { origin: 'Indore', destination: 'Khargone', travelDate: '2099-11-29T00:00:00.000Z', preferredTime: '23:00' } })] }),
  });
  await page.goto('/travel-assistance');
  const card = page.getByTestId('safar-match');
  await expect(card).toContainText('Direct request · for your entry');
  await expect(card).toContainText('Their time: 30 November 2099 · 05:00');
  await expect(card).toContainText('Your travel plan: 29 November 2099 · 23:00 · 6 h apart');
  await expect(card).toContainText('Within 12-hour matching window · Approximate timing — confirm with the traveller.');
});
