import { expect, test } from '@playwright/test';
import { ADMIN, MEMBER, mockApi, NOT_LOGGED_IN } from './mock-api.js';

// Community Services → Blood Help Network: home, become a donor, request blood (with donor suggestions), the
// requests page (tabs, filters, sorting, pages, status rules), the "did you receive the blood?" follow-up and the
// admin verification. The API is mocked; the server's own rules are covered by the backend contract tests.
const en = (page) => page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
const SUMMARY = { donors: 3842, requests: 126, fulfilled: 119 };
const row = (fields) => ({
  id: 'r1', reference: 'BR-0000AAAA', patientName: 'Suresh Patidar', bloodGroup: 'B+', units: 2, hospital: 'Aurobindo Hospital', city: 'Indore',
  status: 'IN_PROGRESS', requestedOn: '2026-11-20T08:00:00.000Z', completedAt: null, completionSource: null, mine: false, contactName: 'Amit Patidar',
  contactPhone: null, whatsapp: 'https://wa.me/919826012345?text=Namaste', ...fields,
});
const PROFILE = { name: 'Rahul Sharma', mobile: '9876543210', city: 'Indore', donor: null, gapDays: 90 };

test('home (visitor): hero, the two actions, live figures, and a login prompt instead of requests', async ({ page }) => {
  await en(page);
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /blood-help/summary': SUMMARY });
  await page.goto('/community-services');
  await expect(page.getByRole('heading', { level: 1, name: /Donate Blood,\s*Save Lives/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Become a Donor Register as a blood donor/ })).toHaveAttribute('href', '/community-services/become-donor');
  await expect(page.getByRole('link', { name: /Request for Blood Need blood for a patient/ })).toHaveAttribute('href', '/community-services/request-blood');
  const figures = page.getByRole('region', { name: 'Community Blood Help Network' });
  for (const [value, label] of [['3,842', 'Registered Donors'], ['126', 'Blood Requests'], ['119', 'Requests Fulfilled']])
    await expect(figures.getByText(label, { exact: true }).locator('..')).toContainText(value);
  await expect(page.getByText('Log in as a registered member to see blood requests')).toBeVisible();
  const nav = page.getByRole('navigation', { name: 'Community Blood Help Network' });
  await expect(nav.getByRole('link', { name: 'Home', exact: true })).toHaveClass(/bg-\[#C8102E\]/);
  // The site's other community sections stay on the page.
  await expect(page.locator('#emergency-help')).toBeVisible();
});

test('home (member): recent requests with only the six columns and a WhatsApp contact', async ({ page }) => {
  await en(page);
  await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /blood-help/summary': SUMMARY, 'GET /blood-help/requests/recent': [row({}), row({ id: 'r2', patientName: 'Kamal Sharma', bloodGroup: 'O+', units: 1, hospital: 'Bombay Hospital' })] });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/community-services');
  const table = page.getByRole('table', { name: 'Recent Blood Requests' });
  await expect(table.getByRole('columnheader')).toHaveText(['Patient Name', 'Blood Group', 'Units', 'Hospital', 'City', 'Contact']);
  const suresh = table.getByRole('row', { name: /Suresh Patidar/ });
  await expect(suresh).toContainText('2 Units');
  await expect(suresh.getByRole('link', { name: 'WhatsApp Amit Patidar' })).toHaveAttribute('href', /^https:\/\/wa\.me\/919826012345/);
  await expect(page.getByRole('link', { name: 'View All Requests' })).toHaveAttribute('href', '/community-services/blood-requests');
});

test('become a donor: name, mobile and city are filled from the profile, editable, required, and saved with the donor', async ({ page }) => {
  await en(page);
  const calls = await mockApi(page, {
    'GET /auth/me': MEMBER,
    'GET /blood-help/me/profile': PROFILE,
    'PUT /blood-help/me/donor': { id: 'd1', bloodGroup: 'O+', lastDonationDate: '2024-04-15', nextEligibleDate: '2024-07-14', available: true },
  });
  await page.goto('/community-services/become-donor');
  await expect(page.getByRole('heading', { name: 'Become a Donor', level: 1 })).toBeVisible();
  const name = page.getByLabel('Name');
  const mobile = page.getByLabel('Mobile Number');
  const city = page.getByLabel('City / Address');
  await expect(name).toHaveValue('Rahul Sharma');
  await expect(mobile).toHaveValue('9876543210');
  await expect(city).toHaveValue('Indore');
  for (const input of [name, mobile, city]) {
    await expect(input).toBeEditable();
    await expect(input).not.toHaveAttribute('readonly');
  }
  await name.fill('');
  await mobile.fill('98765');
  await city.fill('');
  await page.locator('#donor-group').selectOption('O+');
  await page.getByRole('button', { name: 'Register as Donor' }).click();
  await expect(page.getByText('Name is required.')).toBeVisible();
  await expect(page.getByText('Enter a valid 10-digit mobile number.')).toBeVisible();
  await expect(page.getByText('City / Address is required.')).toBeVisible();
  expect(calls.some((call) => call.key === 'PUT /blood-help/me/donor')).toBe(false);
  await name.fill('Rahul K. Sharma');
  await mobile.fill('+91 98260 11111');
  await expect(mobile).toHaveValue('9826011111');
  await city.fill('Vijay Nagar, Indore');
  await page.locator('#donor-last').fill('2024-04-15');
  await page.getByRole('button', { name: 'Register as Donor' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'You are registered as a blood donor' })).toBeVisible();
  expect(calls.find((call) => call.key === 'PUT /blood-help/me/donor').body).toEqual({
    name: 'Rahul K. Sharma', mobile: '9826011111', city: 'Vijay Nagar, Indore', bloodGroup: 'O+', lastDonationDate: '2024-04-15', available: true,
  });
  await expect(page.getByRole('button', { name: 'Update Donor Details' })).toBeVisible();
});

test('become a donor: fields the profile does not have start blank', async ({ page }) => {
  await en(page);
  await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /blood-help/me/profile': { ...PROFILE, name: '', mobile: '', city: '' } });
  await page.goto('/community-services/become-donor');
  for (const label of ['Name', 'Mobile Number', 'City / Address']) await expect(page.getByLabel(label)).toHaveValue('');
});

test('a non-member sees why the network is closed to them', async ({ page }) => {
  await en(page);
  await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /blood-help/me/profile': { status: 403, body: { error: 'BLOOD_MEMBERS_ONLY' } } });
  await page.goto('/community-services/become-donor');
  await expect(page.getByText('The Blood Help Network is for registered NPS members')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Register with the Sangathan' })).toHaveAttribute('href', '/join');
});

test('request blood: validation, units stepper, then donor suggestions with Select All and Send', async ({ page }) => {
  await en(page);
  const suggestions = [
    { donorId: 'd1', name: 'Ravi Patidar', bloodGroup: 'B+', lastDonationDate: '2026-01-02', exactMatch: true },
    { donorId: 'd2', name: 'Neha Patidar', bloodGroup: 'O-', lastDonationDate: null, exactMatch: false },
  ];
  const calls = await mockApi(page, {
    'GET /auth/me': MEMBER,
    'GET /blood-help/me/profile': PROFILE,
    'POST /blood-help/requests': { status: 201, body: { request: row({ id: 'new', reference: 'BR-1234ABCD', mine: true }), suggestions } },
    'POST /blood-help/requests/new/donor-notifications': { sent: 2 },
  });
  await page.goto('/community-services/request-blood');
  await expect(page.locator('#blood-contactName')).toHaveValue('Rahul Sharma');
  await page.getByRole('button', { name: 'Submit Blood Request' }).click();
  await expect(page.getByText('Patient Name is required.')).toBeVisible();
  await expect(page.getByText('Required Blood Group is required.')).toBeVisible();
  expect(calls.some((call) => call.key === 'POST /blood-help/requests')).toBe(false);
  await page.locator('#blood-patientName').fill('Suresh Patidar');
  await page.locator('#blood-bloodGroup').selectOption('B+');
  await page.getByRole('button', { name: 'One unit more' }).click();
  await page.getByRole('button', { name: 'One unit more' }).click();
  await page.getByRole('button', { name: 'One unit less' }).click();
  await expect(page.locator('#blood-units')).toHaveValue('2');
  await page.locator('#blood-hospital').fill('Aurobindo Hospital');
  await page.locator('#blood-contactName').fill('Amit Patidar');
  await page.locator('#blood-contactPhone').fill('98260 12345');
  await page.getByRole('button', { name: 'Submit Blood Request' }).click();
  await expect.poll(() => calls.find((call) => call.key === 'POST /blood-help/requests')?.body).toEqual({
    patientName: 'Suresh Patidar', bloodGroup: 'B+', units: 2, hospital: 'Aurobindo Hospital', city: 'Indore', contactName: 'Amit Patidar', contactPhone: '9826012345', lang: 'en',
  });
  await expect(page.getByText('Your blood request BR-1234ABCD is submitted.')).toBeVisible();
  const list = page.getByRole('region', { name: 'Eligible Donor Suggestions' });
  await expect(list.getByText('Ravi Patidar')).toBeVisible();
  await expect(list.getByText(/Neha Patidar/)).toBeVisible();
  await expect(list.getByText(/Not donated before/)).toBeVisible();
  // A donor's number never reaches the requester: no WhatsApp link per donor, only Send through the portal.
  await expect(list.getByRole('link', { name: /WhatsApp/ })).toHaveCount(0);
  await expect(list.getByText(/\d{10}/)).toHaveCount(0);
  const send = list.getByRole('button', { name: /Send to Selected Donors/ });
  await expect(send).toBeDisabled();
  await list.getByRole('checkbox', { name: 'Select All' }).check();
  await send.click();
  await expect.poll(() => calls.find((call) => call.key === 'POST /blood-help/requests/new/donor-notifications')?.body).toEqual({ donorIds: ['d1', 'd2'], lang: 'en' });
  await expect(list.getByText('Sent to 2 donors as a portal notification.')).toBeVisible();
});

test('blood requests: tab counts, filters and search, sorting, pages, and contact only while in progress', async ({ page }) => {
  await en(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  const community = { rows: [row({}), row({ id: 'r3', patientName: 'Rani Patidar', bloodGroup: 'A-', units: 3, hospital: 'MY Hospital', city: 'Bhopal', status: 'COMPLETED', whatsapp: null })], total: 24, page: 1, pageSize: 10, counts: { mine: 2, community: 124 }, cities: ['Bhopal', 'Indore'] };
  const calls = await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /blood-help/requests': community });
  await page.goto('/community-services/blood-requests');
  await expect(page.getByRole('tab', { name: 'My Requests (2)' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Community Requests (124)' })).toHaveAttribute('aria-selected', 'true');
  const table = page.getByRole('table', { name: 'Community Requests' });
  await expect(table.getByRole('columnheader')).toHaveText(['Patient Name', 'Blood Group', 'Units', 'Hospital / City', 'Requested On', 'Status', 'Action']);
  await expect(table.getByRole('row', { name: /Suresh Patidar/ })).toContainText('In Progress');
  await expect(table.getByRole('row', { name: /Suresh Patidar/ }).getByRole('link', { name: 'WhatsApp Amit Patidar' })).toBeVisible();
  const done = table.getByRole('row', { name: /Rani Patidar/ });
  await expect(done).toContainText('Completed');
  await expect(done.getByRole('link')).toHaveCount(0);
  await expect(done.getByRole('button', { name: 'Contact' })).toHaveAttribute('aria-disabled', 'true');
  const lastQuery = () => new URLSearchParams(calls.filter((call) => call.key === 'GET /blood-help/requests').at(-1).query);
  await page.getByRole('combobox', { name: 'Blood Group' }).selectOption('B+');
  await page.getByRole('combobox', { name: 'City' }).selectOption('Indore');
  await page.getByRole('combobox', { name: 'Status' }).selectOption('IN_PROGRESS');
  await page.getByPlaceholder('Search by Hospital or Patient').fill('aurobindo');
  await expect.poll(() => lastQuery().get('q')).toBe('aurobindo');
  expect(Object.fromEntries(lastQuery())).toMatchObject({ scope: 'community', bloodGroup: 'B+', city: 'Indore', status: 'IN_PROGRESS', sort: '-createdAt', page: '1' });
  await page.getByRole('button', { name: 'Sort by Patient Name' }).click();
  await expect.poll(() => lastQuery().get('sort')).toBe('patientName');
  await page.getByRole('button', { name: 'Page 2' }).click();
  await expect.poll(() => lastQuery().get('page')).toBe('2');
  await page.getByRole('tab', { name: 'My Requests (2)' }).click();
  await expect.poll(() => lastQuery().get('scope')).toBe('mine');
  expect(lastQuery().get('bloodGroup')).toBeNull();
});

test('my requests: the requester sees the contact number and can reopen donor suggestions', async ({ page }) => {
  await en(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  const mine = { rows: [row({ mine: true, contactPhone: '9826012345', whatsapp: null })], total: 1, page: 1, pageSize: 10, counts: { mine: 1, community: 0 }, cities: ['Indore'] };
  await mockApi(page, {
    'GET /auth/me': MEMBER,
    'GET /blood-help/requests': mine,
    'GET /blood-help/requests/r1/suggestions': [{ donorId: 'd1', name: 'Ravi Patidar', bloodGroup: 'O-', lastDonationDate: null, exactMatch: false }],
  });
  await page.goto('/community-services/blood-requests');
  await page.getByRole('tab', { name: /My Requests/ }).click();
  await page.getByRole('button', { name: 'Donor suggestions' }).click();
  await expect(page.getByRole('region', { name: 'Eligible Donor Suggestions' }).getByText('Ravi Patidar')).toBeVisible();
});

test('after login the requester is asked whether the blood was received; Yes completes it', async ({ page }) => {
  await en(page);
  const calls = await mockApi(page, {
    'GET /auth/me': MEMBER,
    'GET /me/family': { family: null, members: [] },
    'GET /blood-help/me/confirmations': [{ id: 'r1', reference: 'BR-0000AAAA', patientName: 'Suresh Patidar', bloodGroup: 'B+', units: 2, hospital: 'Aurobindo Hospital', requestedOn: '2026-11-18T08:00:00Z' }],
    'POST /blood-help/requests/r1/confirmation': { status: 200, body: row({ status: 'COMPLETED', completionSource: 'REQUESTER' }) },
  });
  await page.goto('/portal');
  const dialog = page.getByRole('dialog', { name: 'Did you receive the required blood?' });
  await expect(dialog).toContainText('BR-0000AAAA · Suresh Patidar · B+ · 2 unit(s) · Aurobindo Hospital');
  await dialog.getByRole('button', { name: 'Yes, Blood Received' }).click();
  await expect.poll(() => calls.find((call) => call.key === 'POST /blood-help/requests/r1/confirmation')?.body).toEqual({ received: true });
  await expect(dialog).toContainText('Thank you! The request is marked as completed.');
  await expect(dialog).toHaveCount(0, { timeout: 5000 });
  // Checked once per session: another page doesn't ask again.
  await page.goto('/portal/notifications');
  expect(calls.filter((call) => call.key === 'GET /blood-help/me/confirmations')).toHaveLength(1);
});

test('admin verifies a request with a note; the audit trail shows who confirmed it', async ({ page }) => {
  await en(page);
  const adminRow = { ...row({}), contactPhone: '9826012345', contactWhatsapp: 'https://wa.me/919826012345?text=', requester: { name: 'Rahul Sharma', email: 'r@example.com', phone: '9876543210' }, completedBy: null, history: [{ at: '2026-11-20T08:00:00Z', status: 'IN_PROGRESS', source: 'CREATED', byId: 'u1' }] };
  const calls = await mockApi(page, {
    'GET /auth/me': ADMIN,
    'GET /blood-help/admin/requests': [adminRow],
    'PATCH /blood-help/admin/requests/r1/status': { status: 200, body: { ...adminRow, status: 'COMPLETED', completionSource: 'ADMIN' } },
  });
  await page.goto('/admin/blood-requests');
  await expect(page.getByRole('heading', { name: 'Blood Requests (verification)' })).toBeVisible();
  await expect(page.getByRole('link', { name: '9876543210' })).toHaveAttribute('href', 'tel:+919876543210');
  await page.getByLabel('Verification note (how it was confirmed)').fill('Called the family, blood received');
  await page.getByRole('button', { name: 'Mark Completed' }).click();
  await expect.poll(() => calls.find((call) => call.key === 'PATCH /blood-help/admin/requests/r1/status')?.body).toEqual({ status: 'COMPLETED', note: 'Called the family, blood received' });
});

test('member-only pages send a visitor to login and back', async ({ page }) => {
  await en(page);
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  for (const path of ['/community-services/become-donor', '/community-services/request-blood', '/community-services/blood-requests']) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`/login\\?returnTo=${encodeURIComponent(path)}$`));
  }
});

test('Hindi labels and a phone layout without sideways scrolling', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'hi'));
  await page.setViewportSize({ width: 390, height: 844 });
  await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /blood-help/summary': SUMMARY, 'GET /blood-help/requests/recent': [row({})] });
  await page.goto('/community-services');
  await expect(page.getByRole('heading', { level: 1, name: /रक्तदान करें,\s*जीवन बचाएँ/ })).toBeVisible();
  await expect(page.getByText('पंजीकृत रक्तदाता')).toBeVisible();
  await expect(page.getByText('2 यूनिट').filter({ visible: true }).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
