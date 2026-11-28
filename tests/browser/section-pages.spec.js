import { expect, test } from '@playwright/test';
import { ADMIN, mockApi, NOT_LOGGED_IN } from './mock-api.js';
import { navLink } from './nav-helpers.js';

// Event dates relative to today, so upcoming events stay upcoming whatever day the tests run.
const daysAhead = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

const shot = async (page, name) => { if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${name}.png`, fullPage: true }); };
const noOverflow = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

const ANNOUNCEMENTS = [
  { id: 'n1', status: 'Active', type: 'Urgent', title: 'AGM moved to Sunday', body: 'The annual general meeting is now on Sunday at 10 am.', date: '2026-11-12' },
  { id: 'n2', status: 'Active', type: 'Notice', title: 'Membership renewal open', body: 'Renew before 31 December.', date: '2026-11-01' },
  { id: 'c1', status: 'Active', type: 'News', title: 'Students felicitated', titleHi: 'विद्यार्थियों का सम्मान', body: 'Forty students were felicitated for their results.', date: '2026-10-20' },
  { id: 'c2', status: 'Active', type: 'Event', title: 'Sports day highlights', body: 'Families joined the annual sports day.', date: '2026-10-10' },
  { id: 'g1', status: 'Active', type: 'Festival', title: 'Happy Diwali', body: 'Warm wishes to every family.', date: '2026-11-08' },
  { id: 'x1', status: 'Archived', type: 'Notice', title: 'Old archived notice', body: 'Hidden', date: '2025-01-01' },
];
const EVENTS = [
  { id: 'e1', status: 'PUBLISHED', category: 'GARBA', title: 'Maa Na Garba 2027', venue: 'Lalbagh Palace', date: '2027-10-01', startTime: '19:00', fee: 200, description: 'Nine nights of garba.' },
  { id: 'e2', status: 'PUBLISHED', category: 'CULTURAL', title: 'Sneh Deepotsav', venue: 'Patidar Bhawan', date: daysAhead(3), description: 'Festival of lights.' },
  { id: 'e3', status: 'PUBLISHED', category: 'GENERAL', title: 'Blood camp meeting', venue: 'Office', date: daysAhead(5), description: 'Planning meeting.' },
  { id: 'e4', status: 'PUBLISHED', category: 'CULTURAL', title: 'Holi Milan 2026', venue: 'Garden', date: '2026-03-10', description: 'Past event.' },
  { id: 'e5', status: 'DRAFT', category: 'GARBA', title: 'Draft garba', venue: 'x', date: '2026-12-10' },
];
const post = (o) => ({ titleHi: null, body: null, bodyHi: null, imageUrl: null, eventDate: null, location: null, locationHi: null, contactName: null, contactPhone: null, linkUrl: null, ctaLabel: null, ctaLabelHi: null, featured: false, sortOrder: 0, active: true, createdAt: '', updatedAt: '', ...o });
const POSTS = [
  post({ id: 'b1', section: 'BLOOD_DONATION', title: 'Mega blood donation camp', body: 'Join us to donate blood.', eventDate: '2026-12-05', location: 'Patidar Bhawan, Indore', contactName: 'Ramesh', contactPhone: '+91 98765 43210', featured: true }),
  post({ id: 'm1', section: 'EMERGENCY_HELP', title: 'Samaj ambulance', body: '24x7 ambulance for members.', contactPhone: '98765 00000' }),
  post({ id: 'w1', section: 'SOCIAL_WELFARE', title: 'Scholarship fund', titleHi: 'छात्रवृत्ति कोष', body: 'Support for meritorious students.', linkUrl: '/student-register', ctaLabel: 'Apply' }),
];

for (const width of [390, 1280]) {
  test(`${width}px: every header menu item reaches its page; related services are grouped in two small dropdowns`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
    await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
    await page.goto('/');
    const nav = page.locator('#public-navigation');
    if (width < 1280) await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await expect(nav.locator('summary')).toHaveCount(2);
    for (const label of ['Home', 'About Us', 'Events & Programs', 'Blood Donor', 'Career & Business', 'Sandesh', 'Shagun Bandhan', 'Travel & Assistance', 'Health Support', 'Room Hunting', 'Feedback', 'Contact Us']) await expect(await navLink(page, label)).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Home', exact: true })).toHaveAttribute('aria-current', 'page');
    await shot(page, `header-${width}`);
    await nav.getByRole('link', { name: 'Sandesh', exact: true }).click();
    await expect(page).toHaveURL(/\/news$/);
    if (width < 1280) await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await expect(nav.getByRole('link', { name: 'Sandesh', exact: true })).toHaveAttribute('aria-current', 'page');
    await noOverflow(page);
  });
}

test('Sandesh shows notices, community news and festival greetings as three sections', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /announcements': ANNOUNCEMENTS });
  await page.goto('/news');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('News, notices and greetings from the samaj');
  const notices = page.locator('#notices');
  await expect(notices.getByRole('heading', { level: 3 })).toHaveText(['AGM moved to Sunday', 'Membership renewal open']);
  await expect(notices.getByText('Urgent', { exact: true })).toBeVisible();
  await expect(page.locator('#community').getByRole('heading', { level: 3 })).toHaveText(['Students felicitated', 'Sports day highlights']);
  await expect(page.locator('#greetings').getByRole('heading', { name: 'Happy Diwali' })).toBeVisible();
  await expect(page.getByText('Old archived notice')).toHaveCount(0);
  await page.getByRole('link', { name: /Festival Greetings/ }).click();
  await expect(page.locator('#greetings')).toBeInViewport();
  await notices.getByRole('button', { name: /Read more.*AGM moved to Sunday/ }).click();
  await expect(page.getByRole('dialog')).toContainText('The annual general meeting is now on Sunday at 10 am.');
  await page.keyboard.press('Escape');
  await shot(page, 'sandesh-1280');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/news?category=community');
  await expect(page.locator('#community')).toBeInViewport();
  await noOverflow(page);
  await shot(page, 'sandesh-390');
});

test('Events & Programs: current & upcoming cards, a month-by-month calendar and past events, each event once per section', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  // The API may send an event twice (paging); the page shows it once.
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /events': [...EVENTS, { ...EVENTS[0], slug: 'maa-na-garba-2027' }].map((e, i) => (i === 0 ? { ...e, slug: 'maa-na-garba-2027' } : e)) });
  await page.goto('/events');
  const upcoming = page.locator('#upcoming');
  await expect(upcoming.getByRole('heading', { level: 2 })).toHaveText('Current & Upcoming Events');
  await expect(upcoming).toContainText('Discover upcoming celebrations, cultural programmes and community gatherings.');
  // Soonest first; drafts and past events are not here.
  await expect(upcoming.getByRole('heading', { level: 3 })).toHaveText(['Sneh Deepotsav', 'Blood camp meeting', 'Maa Na Garba 2027']);
  // One card width for all three (no wide "first" card), three in a row on desktop.
  const widths = await upcoming.locator(':scope ul > li[id^="event-"]').evaluateAll((items) => items.map((li) => Math.round(li.getBoundingClientRect().width)));
  expect(new Set(widths).size).toBe(1);
  const tops = await upcoming.locator(':scope ul > li[id^="event-"]').evaluateAll((items) => items.map((li) => Math.round(li.getBoundingClientRect().top)));
  expect(new Set(tops).size).toBe(1);
  await expect(upcoming.getByText('Featured')).toHaveCount(0);
  // "Free" only on free events; a paid one shows its fee.
  await expect(upcoming.locator('#event-e2')).toContainText('Free');
  await expect(upcoming.locator('#event-e1')).toContainText('₹200');
  await expect(upcoming.locator('#event-e1')).not.toContainText('Free');
  // Calendar: months in order, the date, category and place on each row.
  const calendar = page.locator('#calendar');
  await expect(calendar).toContainText('Explore all upcoming programmes month by month.');
  const month = new Date(`${daysAhead(3)}T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  await expect(calendar.getByRole('heading', { level: 3 }).first()).toContainText(new RegExp(month, 'i'));
  await expect(calendar.getByRole('heading', { level: 3, name: /October 2027/i })).toBeVisible();
  await expect(calendar.getByRole('heading', { name: 'Maa Na Garba 2027' })).toHaveCount(1);
  await expect(calendar.getByRole('heading', { name: 'Holi Milan 2026' })).toHaveCount(0);
  await expect(calendar.locator('#calendar-e1')).toContainText('Lalbagh Palace');
  // Past events only in Past Events.
  const past = page.locator('#past');
  await expect(past.getByRole('heading', { level: 3 })).toHaveText(['Holi Milan 2026']);
  await expect(past).toContainText('Completed');
  await expect(past.getByRole('link', { name: /Register/ })).toHaveCount(0);
  await expect(page.getByText('Draft garba')).toHaveCount(0);
  // Every event id once on the page (global search links /events#event-<id>).
  const ids = await page.locator('[id^="event-"]').evaluateAll((nodes) => nodes.map((n) => n.id));
  expect(ids.sort()).toEqual(['event-e1', 'event-e2', 'event-e3', 'event-e4']);
  // View Details: the event's own page when it has one, otherwise the details window.
  await expect(upcoming.locator('#event-e1').getByRole('link', { name: /View Details/ })).toHaveAttribute('href', '/events/maa-na-garba-2027');
  await upcoming.locator('#event-e2').getByRole('button', { name: /View Details/ }).click();
  await expect(page.getByRole('dialog')).toContainText('Patidar Bhawan');
  await page.keyboard.press('Escape');
  await past.getByRole('button', { name: /View Details.*Holi Milan/ }).click();
  await expect(page.getByRole('dialog')).toContainText('Past event.');
  await expect(page.getByRole('dialog').getByRole('link', { name: /Register/ })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await shot(page, 'events-1280');
  // Tablet: two per row; phone: one per row, no sideways scrolling.
  await page.setViewportSize({ width: 820, height: 1100 });
  const tabletTops = await upcoming.locator(':scope ul > li[id^="event-"]').evaluateAll((items) => items.map((li) => Math.round(li.getBoundingClientRect().top)));
  expect(tabletTops[0]).toBe(tabletTops[1]);
  expect(tabletTops[2]).toBeGreaterThan(tabletTops[0]);
  await page.setViewportSize({ width: 390, height: 844 });
  const phoneTops = await upcoming.locator(':scope ul > li[id^="event-"]').evaluateAll((items) => items.map((li) => Math.round(li.getBoundingClientRect().top)));
  expect(phoneTops[1]).toBeGreaterThan(phoneTops[0]);
  await noOverflow(page);
  await shot(page, 'events-390');
  expect(errors).toEqual([]);
});

test('Events & Programs: empty sections show a message; old /events#garba links open the first section', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /events': [EVENTS[1]] });
  await page.goto('/events#garba');
  await expect(page.locator('#upcoming')).toBeInViewport();
  await expect(page.locator('#past')).toContainText('No past events yet.');
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /events': [EVENTS[3]] });
  await page.goto('/events');
  await expect(page.locator('#upcoming')).toContainText('No upcoming events are scheduled yet.');
  await expect(page.locator('#calendar')).toContainText('No upcoming events are scheduled yet.');
  await expect(page.locator('#past').getByRole('heading', { level: 3 })).toHaveText(['Holi Milan 2026']);
});

test('Community Services shows blood donation, emergency help and social welfare posts', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => { if (!localStorage.getItem('pss_lang')) localStorage.setItem('pss_lang', 'en'); });
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /community-posts': POSTS });
  await page.goto('/community-services#emergency-help');
  await expect(page.locator('#emergency-help')).toBeInViewport();
  await expect(page.locator('#blood-donation').getByRole('heading', { name: 'Mega blood donation camp' })).toBeVisible();
  await expect(page.locator('#blood-donation').getByRole('link', { name: /98765 43210/ })).toHaveAttribute('href', 'tel:+919876543210');
  await expect(page.locator('#emergency-help').getByRole('link', { name: /112/ })).toHaveAttribute('href', 'tel:112');
  await expect(page.locator('#emergency-help').getByRole('link', { name: 'Call Samaj ambulance: 98765 00000' })).toBeVisible();
  await expect(page.locator('#social-welfare').getByRole('link', { name: 'Apply' })).toHaveAttribute('href', '/student-register');
  await shot(page, 'services-1280');
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow(page);
  await shot(page, 'services-390');
  await page.evaluate(() => localStorage.setItem('pss_lang', 'hi'));
  await page.reload();
  await expect(page.locator('#social-welfare').getByRole('heading', { name: 'छात्रवृत्ति कोष' })).toBeVisible();
});

test('admins add Community Services posts and pick event and Sandesh sections', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  const rows = [];
  await mockApi(page, { 'GET /auth/me': ADMIN });
  await page.route('**/api/v1/community-posts', async (route) => {
    if (route.request().method() === 'POST') {
      const row = post({ ...route.request().postDataJSON(), id: `p${rows.length + 1}` });
      rows.push(row);
      return route.fulfill({ status: 201, json: row });
    }
    return route.fulfill({ json: rows });
  });
  await page.goto('/admin/community-services');
  await page.getByRole('tab', { name: /Emergency Help/ }).click();
  await page.getByRole('button', { name: 'Add post' }).click();
  await page.getByLabel('Title (English) *').fill('Samaj ambulance');
  await page.getByLabel('Phone / helpline').fill('108');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Saved.')).toBeVisible();
  expect(rows[0]).toMatchObject({ section: 'EMERGENCY_HELP', title: 'Samaj ambulance', contactPhone: '108', eventDate: null });
  await shot(page, 'admin-services-1280');
  await page.goto('/admin/events');
  await page.getByRole('button', { name: /Create Sneh Deepotsav/ }).click();
  await expect(page.locator('#event-category')).toHaveValue('CULTURAL');
  await expect(page.locator('#event-category option')).toHaveText(['Maa Na Garba', 'Cultural Program', 'Community event (calendar only)']);
});
