import { test, expect } from '@playwright/test';
import { mockApi, MEMBER, ADMIN, NOT_LOGGED_IN } from './mock-api';

const resource = { id: 'resource-1', titleEn: 'Official Health Information', titleHi: 'आधिकारिक स्वास्थ्य जानकारी', descriptionEn: 'Official reference only.', descriptionHi: 'केवल आधिकारिक संदर्भ।', source: 'MoHFW', url: 'https://www.mohfw.gov.in/', category: 'HEALTH', verified: true, published: true };
const mr = { id: 'mr-1', userId: 'mr-user', name: 'Test MR', company: 'Test Company', role: 'MR', city: 'Indore', areas: ['Vijay Nagar'], phone: '9000000000', whatsapp: '9000000000', assistance: 'BOTH', status: 'APPROVED', membershipId: 'TEST-MEM-1', publishContact: true, emailOptIn: false, whatsappOptIn: false };
const publicData = () => ({ resources: [resource], mrs: [mr], capabilities: { email: true, whatsapp: false, inApp: true } });
const memberData = () => ({ profile: { name: MEMBER.fullName, phone: '9876500001', email: MEMBER.email, membershipId: 'TEST-MEM-1' }, mr: null, requests: [], routed: [], reports: [], notifications: [] });

for (const lang of ['en', 'hi']) {
 test(`${lang}: public resources, area search, safe contacts and member-only form`, async ({ page }) => {
  const hi = lang === 'hi'; await page.setViewportSize({ width: 320, height: 900 });
  await page.addInitScript(value => localStorage.setItem('pss_lang', value), lang);
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /sehat-saathi/public': publicData() });
  await page.goto('/medical');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(hi ? 'विश्वसनीय जानकारी। ज़िम्मेदार सहायता।' : 'Trusted Resources. Responsible Assistance.');
  await expect(page.getByRole('link', { name: hi ? 'स्रोत देखें' : 'Visit source', exact: true })).toHaveAttribute('href', resource.url);
  await expect(page.getByRole('link', { name: hi ? 'कॉल करें' : 'Call', exact: true })).toHaveAttribute('href', 'tel:9000000000');
  await expect(page.getByRole('link', { name: hi ? 'व्हाट्सऐप' : 'WhatsApp', exact: true })).toHaveAttribute('href', 'https://wa.me/919000000000');
  await page.locator('#mr-search').fill('no-such-area'); await expect(page.getByRole('heading', { name: mr.name })).toHaveCount(0);
  await page.locator('#health-category').selectOption('HOSPITAL'); await expect(page.getByRole('link', { name: hi ? 'स्रोत देखें' : 'Visit source', exact: true })).toHaveCount(0);
  await expect(page.locator('#request-medicine')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 });
 test(`${lang}: real API form submission, tracking, MR registration and complaint`, async ({ page }) => {
  const hi = lang === 'hi'; await page.setViewportSize({ width: 390, height: 900 });
  await page.addInitScript(value => localStorage.setItem('pss_lang', value), lang);
  await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /sehat-saathi/public': publicData() });
  const data = memberData(); let saved;
  await page.route('**/api/v1/sehat-saathi/me', route => route.fulfill({ json: data }));
  await page.route('**/api/v1/sehat-saathi/requests', async route => { saved = route.request().postDataJSON(); data.requests = [{ ...saved, id: 'request-1', reference: 'SEHAT-TEST-1', status: 'PENDING' }]; await route.fulfill({ json: { id: 'request-1', reference: 'SEHAT-TEST-1' } }); });
  await page.route('**/api/v1/sehat-saathi/mrs', async route => { data.mr = { ...route.request().postDataJSON(), id: 'own-mr', status: 'PENDING', updatedAt: '2026-10-28' }; await route.fulfill({ json: data.mr }); });
  await page.route('**/api/v1/sehat-saathi/reports', async route => { data.reports.push({ ...route.request().postDataJSON(), id: 'report-1', status: 'OPEN' }); await route.fulfill({ json: data.reports[0] }); });
  await page.goto('/medical'); await expect(page.locator('#request-phone')).toHaveValue('9876500001');
  await page.locator('#request-medicine').fill('TEST-MEDICINE-NOT-REAL'); await page.locator('#request-area').fill('Vijay Nagar');
  await page.locator('#request-consent').check();
  await expect(page.locator('#request-whatsappOptIn')).toBeDisabled();
  await page.getByRole('button', { name: hi ? 'सहेजें' : 'Save', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('SEHAT-TEST-1');
  expect(saved).toMatchObject({ medicine: 'TEST-MEDICINE-NOT-REAL', phone: '9876500001', quantity: 1, consent: true, lang });
  expect(saved.clientRequestId).toMatch(/^[a-f0-9-]{36}$/);
  await expect(page.getByRole('heading', { name: 'SEHAT-TEST-1', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: hi ? 'एमआर जोड़ें / एमआर पंजीकरण' : 'Add MR / Register as MR', exact: true }).click();
  await page.locator('#mr-company').fill('Fictional Test Company'); await page.locator('#mr-role').fill('MR'); await page.locator('#mr-areas').fill('Vijay Nagar');
  await page.locator('#mr-consent').check(); await page.getByRole('button', { name: hi ? 'सहेजें' : 'Save', exact: true }).click();
  await expect(page.getByRole('heading', { name: hi ? 'मेरा एमआर सत्यापन' : 'My MR Verification', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: hi ? 'रिपोर्ट और शिकायतें' : 'Reports & Complaints', exact: true }).click();
  await page.locator('#report-targetId').fill('mr-1'); await page.locator('#report-message').fill('Test complaint only');
  await page.getByRole('button', { name: hi ? 'सहेजें' : 'Save', exact: true }).click();
  await expect(page.getByText('Test complaint only', { exact: true })).toBeVisible();
 });
 test(`${lang}: verified MR sees no medical/contact detail until accepting routed request`, async ({ page }) => {
  const hi = lang === 'hi'; await page.addInitScript(value => localStorage.setItem('pss_lang', value), lang);
  await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /sehat-saathi/public': publicData() });
  const data = memberData(); data.mr = mr; data.routed = [{ id: 'request-1', reference: 'SEHAT-PRIVATE', city: 'Indore', area: 'Vijay Nagar', assistance: 'ALTERNATIVES', routingStatus: 'INVITED', status: 'PENDING', details: null }];
  await page.route('**/api/v1/sehat-saathi/me', route => route.fulfill({ json: data }));
  await page.route('**/api/v1/sehat-saathi/requests/request-1/mr-action', async route => { const { action } = route.request().postDataJSON(); data.routed[0].routingStatus = 'ACCEPTED'; data.routed[0].status = action === 'ACCEPT' ? 'IN_PROGRESS' : action; data.routed[0].details = { medicine: 'PRIVATE-TEST-MEDICINE', quantity: 1, name: 'Private Test Member', phone: '9111111111' }; await route.fulfill({ json: { ok: true } }); });
  await page.goto('/medical'); await page.getByRole('tab', { name: hi ? 'मुझे भेजे गए अनुरोध' : 'Requests Routed to Me', exact: true }).click();
  await expect(page.getByText('PRIVATE-TEST-MEDICINE', { exact: false })).toHaveCount(0);
  await expect(page.locator('a[href="tel:9111111111"]')).toHaveCount(0);
  await page.getByRole('button', { name: hi ? 'अनुरोध स्वीकार करें' : 'Accept Request', exact: true }).click();
  await expect(page.getByText('PRIVATE-TEST-MEDICINE', { exact: false })).toBeVisible();
  await expect(page.locator('a[href="tel:9111111111"]')).toBeVisible();
  await page.getByRole('button', { name: hi ? 'सहायता मिली' : 'Assistance Found', exact: true }).click();
  await expect(page.getByRole('button', { name: hi ? 'सहायता मिली' : 'Assistance Found', exact: true })).toHaveCount(0);
 });
}

test('Hindi-first default and backend rejection never shows a false success', async ({ page }) => {
 await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /sehat-saathi/public': publicData(), 'GET /sehat-saathi/me': memberData(), 'POST /sehat-saathi/requests': { status: 400, body: { error: 'SEHAT_REGISTERED_MOBILE' } } });
 await page.goto('/medical'); await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
 await page.locator('#request-medicine').fill('Test'); await page.locator('#request-area').fill('Test'); await page.locator('#request-consent').check();
 await page.getByRole('button', { name: 'सहेजें', exact: true }).click();
 await expect(page.getByRole('alert')).toContainText('पंजीकृत मोबाइल नंबर');
 await expect(page.getByRole('status')).toHaveCount(0);
});

for (const lang of ['en', 'hi']) test(`${lang}: admin approves MRs, manages resources, assigns requests, resolves reports and inspects audit`, async ({ page }) => {
 const hi = lang === 'hi'; await page.setViewportSize({ width: hi ? 390 : 1440, height: 1000 });
 await page.addInitScript(value => localStorage.setItem('pss_lang', value), lang);
 const pub = publicData();
 const state = { mrs: [{ ...mr, status: 'PENDING' }], resources: [], requests: [{ id: 'request-admin', userId: MEMBER.id, clientRequestId: '8b7f568e-f610-4d25-b42e-edac0a9b14a6', reference: 'SEHAT-ADMIN-TEST', medicine: 'Test', name: 'Test Member', phone: '9000000000', quantity: 1, assistance: 'ALTERNATIVES', city: 'Indore', area: 'Vijay Nagar', status: 'PENDING', emailOptIn: false, whatsappOptIn: false, lang }], reports: [{ id: 'report-admin', targetType: 'MR', targetId: mr.id, message: 'Test complaint', status: 'OPEN' }], notifications: [{ id: 'notice-admin', userId: MEMBER.id, topic: 'REQUEST_SAVED', channel: 'EMAIL', status: 'FAILED' }], audits: [{ id: 'audit-test', actorId: ADMIN.id, action: 'CREATE', entityType: 'MR', entityId: mr.id, createdAt: '2026-10-28T00:00:00Z' }] };
 await mockApi(page, { 'GET /auth/me': ADMIN });
 await page.route('**/api/v1/sehat-saathi/public', route => route.fulfill({ json: pub }));
 await page.route('**/api/v1/sehat-saathi/admin', route => route.fulfill({ json: state }));
 let mrPatch; let requestPatch; let reportPatch;
 await page.route('**/api/v1/sehat-saathi/admin/mrs/mr-1', async route => { mrPatch = route.request().postDataJSON(); Object.assign(state.mrs[0], mrPatch); await route.fulfill({ json: { ok: true } }); });
 await page.route('**/api/v1/sehat-saathi/admin/resources', async route => { const created = { ...route.request().postDataJSON(), id: 'created-resource' }; state.resources.push(created); await route.fulfill({ json: created }); });
 await page.route('**/api/v1/sehat-saathi/admin/resources/created-resource', async route => { state.resources = []; await route.fulfill({ json: { ok: true } }); });
 await page.route('**/api/v1/sehat-saathi/admin/requests/request-admin', async route => { requestPatch = route.request().postDataJSON(); Object.assign(state.requests[0], requestPatch); await route.fulfill({ json: { ok: true } }); });
 await page.route('**/api/v1/sehat-saathi/admin/reports/report-admin', async route => { reportPatch = route.request().postDataJSON(); Object.assign(state.reports[0], reportPatch); await route.fulfill({ json: { ok: true } }); });
 await page.route('**/api/v1/sehat-saathi/admin/notifications/notice-admin/retry', async route => { state.notifications[0].status = 'ACCEPTED'; await route.fulfill({ json: { ok: true } }); });
 await page.goto('/admin/sehat-saathi');
 await page.getByRole('button', { name: hi ? 'संपादित करें' : 'Edit', exact: true }).click();
 await page.locator('#mr-status').selectOption('APPROVED'); await page.getByRole('button', { name: hi ? 'सहेजें' : 'Save', exact: true }).click();
 await expect.poll(() => mrPatch?.status).toBe('APPROVED');
 await page.getByRole('tab', { name: hi ? 'स्वास्थ्य संसाधन' : 'Health Resources', exact: true }).click();
 await page.getByRole('button', { name: hi ? 'नया जोड़ें' : 'Add New', exact: true }).click();
 for (const [key, value] of Object.entries({ titleEn: 'New Official Resource', titleHi: 'नया आधिकारिक स्रोत', descriptionEn: 'Test description', descriptionHi: 'परीक्षण विवरण', source: 'MoHFW', url: 'https://www.mohfw.gov.in/' })) await page.locator(`#resource-${key}`).fill(value);
 await page.locator('#resource-verified').check(); await page.locator('#resource-published').check();
 await page.getByRole('button', { name: hi ? 'सहेजें' : 'Save', exact: true }).click();
 await expect(page.getByRole('heading', { name: hi ? 'नया आधिकारिक स्रोत' : 'New Official Resource', exact: true })).toBeVisible();
 page.once('dialog', dialog => dialog.accept()); await page.getByRole('button', { name: hi ? 'हटाएँ' : 'Delete', exact: true }).click();
 await expect(page.getByRole('heading', { name: hi ? 'नया आधिकारिक स्रोत' : 'New Official Resource', exact: true })).toHaveCount(0);
 await page.getByRole('tab', { name: hi ? 'सहायता अनुरोध' : 'Assistance Requests', exact: true }).click();
 await page.getByRole('button', { name: hi ? 'संपादित करें' : 'Edit', exact: true }).click();
 await page.locator('#request-assignedMrId').selectOption(mr.id); await page.getByRole('button', { name: hi ? 'सहेजें' : 'Save', exact: true }).click();
 await expect.poll(() => requestPatch?.assignedMrId).toBe(mr.id);
 await page.getByRole('tab', { name: hi ? 'रिपोर्ट और शिकायतें' : 'Reports & Complaints', exact: true }).click();
 await page.getByRole('button', { name: hi ? 'संपादित करें' : 'Edit', exact: true }).click();
 await page.locator('#report-status').selectOption('RESOLVED'); await page.locator('#report-resolution').fill('Test resolution');
 await page.getByRole('button', { name: hi ? 'सहेजें' : 'Save', exact: true }).click();
 await expect.poll(() => reportPatch?.status).toBe('RESOLVED');
 await page.getByRole('tab', { name: hi ? 'सूचना लॉग' : 'Notification Logs', exact: true }).click();
 await page.getByRole('button', { name: hi ? 'सूचना दोबारा भेजें' : 'Retry Notification', exact: true }).click();
 await expect(page.getByRole('button', { name: hi ? 'सूचना दोबारा भेजें' : 'Retry Notification', exact: true })).toHaveCount(0);
 await page.getByRole('tab', { name: hi ? 'ऑडिट इतिहास' : 'Audit History', exact: true }).click();
 await expect(page.getByRole('button', { name: hi ? 'हटाएँ' : 'Delete', exact: true })).toHaveCount(0);
 await expect(page.getByRole('button', { name: hi ? 'ऑडिट सीएसवी डाउनलोड करें' : 'Export Audit CSV', exact: true })).toBeVisible();
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('members can withdraw notification consent even while providers are unavailable', async ({ page }) => {
 await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
 const pub = publicData(); pub.capabilities = { email: false, whatsapp: false, inApp: true };
 const data = memberData(); data.mr = { ...mr, userId: MEMBER.id, emailOptIn: true, whatsappOptIn: true };
 await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /sehat-saathi/public': pub });
 await page.route('**/api/v1/sehat-saathi/me', route => route.fulfill({ json: data }));
 let saved;
 await page.route('**/api/v1/sehat-saathi/mrs', async route => { saved = route.request().postDataJSON(); data.mr = { ...saved, id: mr.id, status: 'PENDING' }; await route.fulfill({ json: data.mr }); });
 await page.goto('/medical'); await page.getByRole('tab', { name: 'Add MR / Register as MR', exact: true }).click();
 await expect(page.locator('#mr-emailOptIn')).toBeEnabled(); await expect(page.locator('#mr-whatsappOptIn')).toBeEnabled();
 await page.locator('#mr-emailOptIn').uncheck(); await page.locator('#mr-whatsappOptIn').uncheck(); await page.locator('#mr-consent').check();
 await page.getByRole('button', { name: 'Save', exact: true }).click();
 await expect.poll(() => saved?.emailOptIn).toBe(false); expect(saved.whatsappOptIn).toBe(false);
});

test('switching language preserves the medical request draft', async ({ page }) => {
 await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
 await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /sehat-saathi/public': publicData(), 'GET /sehat-saathi/me': memberData() });
 await page.goto('/medical'); await page.locator('#request-medicine').fill('TEST-DRAFT');
 await page.locator('header').getByRole('button', { name: 'हिंदी में देखें', exact: true }).filter({ visible: true }).first().click();
 await expect(page.locator('#request-medicine')).toHaveValue('TEST-DRAFT');
 await expect(page.getByRole('heading', { level: 1 })).toHaveText('विश्वसनीय जानकारी। ज़िम्मेदार सहायता।');
 await expect(page.getByLabel('दवा का नाम', { exact: false })).toHaveValue('TEST-DRAFT');
});
