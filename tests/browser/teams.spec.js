import { expect, test } from '@playwright/test';
import { ADMIN, MEMBER, mockApi, NOT_LOGGED_IN } from './mock-api.js';

// Event dates relative to today, so upcoming events stay upcoming whatever day the tests run.
const daysAhead = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

// Become an NPSI Event Member: the footer popup, the dashboard button with autofill, event-wise team sections, the
// Core Team page, and the central admin menu (API mocked).
const EVENT = { id: 'e1', slug: 'sneh-deepotsav-2026', title: 'Sneh Deepotsav 2026', titleHi: 'स्नेह दीपोत्सव 2026', date: daysAhead(12), venue: 'Indore', bannerUrl: null, description: 'Festival of lights', descriptionHi: null };
const card = (o) => ({ id: 'c', name: 'X', designation: null, designationHi: null, photoUrl: null, village: 'Temla', area: 'Vijay Nagar', mobile: null, email: null, ...o });
const DEEPOTSAV = { event: EVENT, sections: [{ key: 'DEEPOTSAV', label: 'Sneh Deepotsav (Dev Utsav)', labelHi: null, heading: 'Deepotsav Team', headingHi: 'दीपोत्सव टीम', isCoreTeam: false,
  members: [card({ id: 'a1', name: 'Ravi Patidar', mobile: '9876500001' }), card({ id: 'a2', name: 'Meena Patidar', village: 'Khedi' })] }] };
const SECTIONS = [
  { key: 'CORE_TEAM', label: 'Core Team', labelHi: 'कोर टीम', heading: 'Core Team', headingHi: 'कोर टीम', isCoreTeam: true },
  { key: 'DEEPOTSAV', label: 'Sneh Deepotsav (Dev Utsav)', labelHi: null, heading: 'Deepotsav Team', headingHi: null, isCoreTeam: false },
  { key: 'GARBA', label: 'Maa Na Garba', labelHi: null, heading: 'Maa Na Garba Team', headingHi: null, isCoreTeam: false },
  { key: 'HOLI', label: 'Holi Milan', labelHi: null, heading: 'Holi Milan Team', headingHi: null, isCoreTeam: false },
];
const en = (page) => page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));

test('event page shows its "Deepotsav Team" section; mobile only when the member agreed', async ({ page }) => {
  await en(page);
  const calls = await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /event-members/teams': DEEPOTSAV });
  await page.goto('/events/sneh-deepotsav-2026');
  await expect(page.getByRole('heading', { level: 1, name: 'Sneh Deepotsav 2026' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Deepotsav Team' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Team Members' })).toHaveCount(0);
  const team = page.locator('#team-deepotsav');
  await expect(team.locator('article')).toHaveCount(2);
  await expect(team.getByRole('link', { name: '98765 00001' })).toHaveAttribute('href', 'tel:+919876500001');
  await expect(team.locator('article').filter({ hasText: 'Meena Patidar' }).getByRole('link')).toHaveCount(0);
  expect(calls.find((call) => call.key === 'GET /event-members/teams').query).toBe('?event=sneh-deepotsav-2026');
  // No separate joining form on the event page any more.
  await expect(page.getByText('Join the event team')).toHaveCount(0);
});

test('footer "Become a Member": the one popup form with Other, validation and a public submission', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await en(page);
  const calls = await mockApi(page, {
    'GET /auth/me': NOT_LOGGED_IN,
    'GET /event-member-sections': SECTIONS,
    'POST /event-member-applications': { status: 201, body: { id: 'n1', status: 'PENDING' } },
  });
  await page.goto('/');
  await expect(page.locator('footer').getByRole('link', { name: 'Join the Sangathan' })).toHaveCount(0);
  await page.locator('footer').getByRole('button', { name: 'Become a Member' }).click();
  const dialog = page.getByRole('dialog', { name: 'Become an NPSI Event Member' });
  await expect(dialog).toBeVisible();
  const select = dialog.getByLabel('Area / interested event *');
  await expect(select.locator('option')).toHaveText(['Select…', 'Core Team', 'Sneh Deepotsav (Dev Utsav)', 'Maa Na Garba', 'Holi Milan', 'Other']);
  await select.selectOption('OTHER');
  await expect(dialog.getByLabel('Enter Event / Team Name *')).toBeVisible();
  await dialog.getByRole('button', { name: 'Submit Request' }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Enter the event or team name.');
  await dialog.getByLabel('Enter Event / Team Name *').fill('Ganesh Utsav');
  await dialog.getByLabel('Name *', { exact: true }).fill('Asha Patidar');
  await dialog.getByLabel('Mobile number *').fill('98765 4321');
  await dialog.getByRole('button', { name: 'Submit Request' }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Enter a valid 10-digit mobile number.');
  await dialog.getByLabel('Mobile number *').fill('9876543210');
  await dialog.getByLabel('Email ID *').fill('asha@example.com');
  // Village: the 62 native villages to pick from, or type one that isn't listed.
  const village = dialog.getByLabel('Village *');
  await village.click();
  await expect(dialog.getByRole('listbox', { name: 'Village' }).getByRole('option')).toHaveCount(62);
  await village.fill('Kasrawad');
  await expect(village).toHaveValue('Kasrawad');
  await village.fill('tem');
  await dialog.getByRole('option', { name: 'Temla', exact: true }).click();
  await expect(village).toHaveValue('Temla');
  await dialog.locator('#em-area').fill('Vijay Nagar');
  await dialog.locator('#em-area').press('Enter');
  await dialog.getByRole('button', { name: 'Submit Request' }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Please agree to show the details on the team page.');
  await dialog.getByLabel(/I agree that my name/).check();
  await dialog.getByRole('button', { name: 'Submit Request' }).click();
  await expect(dialog.getByRole('status')).toContainText('Request submitted');
  const sent = calls.filter((call) => call.key === 'POST /event-member-applications');
  expect(sent).toHaveLength(1);
  expect(sent[0].body).toMatchObject({ sectionKey: 'OTHER', customEventName: 'Ganesh Utsav', name: 'Asha Patidar', mobile: '9876543210', village: 'Temla', mobilePublic: false, emailPublic: false, consent: true });
  expect(sent[0].body.personId).toBeUndefined();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('registered member: one question and the event, details come from the registration; status listed, pending can be withdrawn', async ({ page }) => {
  await en(page);
  const calls = await mockApi(page, {
    'GET /auth/me': { ...MEMBER, account: { type: 'FAMILY', status: 'ACTIVE' } },
    'GET /event-member-sections': SECTIONS,
    'GET /me/profile-completion': { percent: 100, steps: [], next: null },
    'GET /event-member-applications/candidates': {
      candidates: [{ kind: 'MEMBER', id: 'm1', name: 'Ram Patidar', fatherName: null, village: 'Temla', mobile: '9876500001', email: 'ram@example.com', photoUrl: null, self: true }],
      applications: [{ id: 'p1', section: SECTIONS[2], customEventName: null, name: 'Ram Patidar', status: 'PENDING', rejectionReason: null }],
    },
    'POST /event-member-applications': { status: 201, body: { id: 'n2', status: 'PENDING' } },
    'POST /event-member-applications/p1/withdrawal': { status: 200, body: { id: 'p1', status: 'WITHDRAWN' } },
  });
  await page.goto('/portal');
  await expect(page.getByText('Maa Na Garba')).toBeVisible();
  await expect(page.getByText('Pending', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Become an NPSI Event Member' }).click();
  const dialog = page.getByRole('dialog', { name: 'Do you want to become a member?' });
  await expect(dialog).toContainText('Applying as: Ram Patidar');
  // No second form: no name / mobile / email / village / photo fields for a registered member.
  for (const label of ['Name *', 'Mobile number *', 'Email ID *', 'Village *']) await expect(dialog.getByLabel(label, { exact: true })).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Submit' }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Choose the team / event.');
  await dialog.getByLabel('Area / interested event *').selectOption('DEEPOTSAV');
  await dialog.getByRole('button', { name: 'Submit' }).click();
  await expect(dialog.getByRole('status')).toBeVisible();
  const body = calls.find((call) => call.key === 'POST /event-member-applications').body;
  expect(body).toEqual({ sectionKey: 'DEEPOTSAV', personKind: 'MEMBER', personId: 'm1', consent: true });
  await dialog.getByRole('status').getByRole('button', { name: 'Close' }).click();
  await page.getByRole('button', { name: 'Withdraw' }).click();
  await expect.poll(() => calls.some((call) => call.key === 'POST /event-member-applications/p1/withdrawal')).toBe(true);
});

test('Core Team page and team pages read their section', async ({ page }) => {
  await en(page);
  const calls = await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /event-members/teams': { event: null, sections: [{ ...SECTIONS[0], members: [card({ id: 'k1', name: 'Suresh Patidar', designation: 'President' })] }] } });
  await page.goto('/core-team');
  await expect(page.getByRole('heading', { level: 1, name: 'Core Team' })).toBeVisible();
  await expect(page.getByText('President')).toBeVisible();
  expect(calls.find((call) => call.key === 'GET /event-members/teams').query).toBe('?section=CORE_TEAM');
  await page.locator('footer').getByRole('link', { name: 'Core Team' }).click();
  await expect(page).toHaveURL(/\/core-team$/);
});

test('admin: one menu lists every request; approve with confirmation, reject needs a reason, filters work', async ({ page }) => {
  // Checks the desktop sidebar / header links (on phones they sit in the menu).
  await page.setViewportSize({ width: 1280, height: 900 });
  await en(page);
  const row = (o) => ({ id: 'x', sectionId: 's-deep', section: { key: 'DEEPOTSAV', label: 'Sneh Deepotsav (Dev Utsav)', labelHi: null, heading: 'Deepotsav Team' }, customEventName: null, name: 'X', mobileDigits: '9876500001', email: 'x@example.com', village: 'Temla', area: 'Palasia', status: 'PENDING', showOnWebsite: true, mobilePublic: false, emailPublic: false, photoUrl: null, source: 'PUBLIC', createdAt: '2026-11-10T10:00:00Z', sortOrder: 0, ...o });
  const calls = await mockApi(page, {
    'GET /auth/me': ADMIN,
    'GET /event-member-applications': [row({ id: 'p1', name: 'Pending Person' }), row({ id: 'p2', name: 'Approved Person', status: 'APPROVED' }), row({ id: 'p3', name: 'Other Person', sectionId: null, section: null, customEventName: 'Ganesh Utsav' })],
    'GET /event-member-sections/admin': { sections: [{ id: 's-core', key: 'CORE_TEAM', label: 'Core Team', heading: 'Core Team', isCoreTeam: true, status: 'ACTIVE', accepting: true, approved: 1, pending: 0 }, { id: 's-deep', key: 'DEEPOTSAV', label: 'Sneh Deepotsav (Dev Utsav)', heading: 'Deepotsav Team', status: 'ACTIVE', accepting: true, approved: 1, pending: 1, eventId: 'e1', event: { slug: 'sneh-deepotsav-2026' } }], other: { pending: 1 } },
    'GET /event-member-applications/p1/history': [{ id: 'h1', action: 'SUBMITTED', createdAt: '2026-11-10T10:00:00Z' }],
    'GET /event-member-applications/p3/history': [],
    'POST /event-member-applications/p1/review': { status: 200, body: { id: 'p1', status: 'APPROVED' } },
  });
  await page.goto('/admin/event-members');
  await expect(page.getByRole('heading', { level: 1, name: 'Become a NPSI Event Member' })).toBeVisible();
  await expect(page.locator('aside, nav').getByRole('link', { name: 'Become a NPSI Event Member' }).first()).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(3);
  await page.getByLabel('Status').selectOption('PENDING');
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await page.getByLabel('Search name, mobile, village or event').fill('ganesh');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByLabel('Search name, mobile, village or event').fill('');
  await page.locator('tbody tr').filter({ hasText: 'Pending Person' }).getByRole('button', { name: 'Reject' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Reject' }).last().click();
  await expect(page.getByRole('dialog').getByRole('alert')).toHaveText('Please give a reason.');
  await page.keyboard.press('Escape');
  await page.locator('tbody tr').filter({ hasText: 'Pending Person' }).getByRole('button', { name: 'Approve' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Approve' }).last().click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Confirm' }).click();
  await expect.poll(() => calls.find((call) => call.key === 'POST /event-member-applications/p1/review')?.body).toEqual({ decision: 'APPROVED' });
  // An OTHER request must be mapped to a section before it can be approved.
  await page.locator('tbody tr').filter({ hasText: 'Other Person' }).getByRole('button', { name: 'Approve' }).click();
  await expect(page.getByRole('dialog').getByLabel('Map to section')).toHaveValue('');
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Approve' }).last()).toBeDisabled();
});

test('the old admin Core Team URL opens the central menu filtered to the Core Team', async ({ page }) => {
  await en(page);
  await mockApi(page, { 'GET /auth/me': ADMIN, 'GET /event-member-sections/admin': { sections: [{ id: 's-core', key: 'CORE_TEAM', label: 'Core Team', heading: 'Core Team', status: 'ACTIVE', approved: 0, pending: 0 }], other: { pending: 0 } } });
  await page.goto('/admin/core-team');
  await expect(page).toHaveURL(/\/admin\/event-members\?section=CORE_TEAM$/);
  await expect(page.getByLabel('Interested Event')).toHaveValue('CORE_TEAM');
});
