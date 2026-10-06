import { expect, test } from '@playwright/test';
import { MEMBER, mockApi } from './mock-api.js';

const event = (id, title) => ({ id, title, status: 'PUBLISHED', date: '2026-12-01', venue: 'Hall', fee: 0, createdAt: '2026-10-01T10:00:00.000Z', updatedAt: '2026-10-01T10:00:00.000Z' });
const family = { family: { id: 'f-1', familyId: 'NPSI-FAM-000001', familyName: 'Patidar' }, members: [{ id: 'm-1', name: 'Ram Patidar', relationship: 'Head' }], student: null };

test('events the family is registered for show "Registered"; a cancelled registration can register again', async ({ page }) => {
  const calls = await mockApi(page, {
    'GET /auth/me': MEMBER,
    'GET /events': [event('ev-garba', 'Garba Night'), event('ev-puja', 'Diwali Puja'), event('ev-holi', 'Holi Milan')],
    'GET /me/family': family,
    'GET /me/event-registrations': [
      { id: 'r-1', eventId: 'ev-garba', familyId: 'NPSI-FAM-000001', status: 'REGISTERED' },
      { id: 'r-2', eventId: 'ev-holi', familyId: 'NPSI-FAM-000001', status: 'CANCELLED' },
    ],
    'POST /event-registrations': { status: 201, body: { id: 'r-3', eventId: 'ev-puja', paymentStatus: 'SUCCESS' } },
  });
  await page.goto('/portal/events');
  const card = (title) => page.locator('div.rounded-2xl', { has: page.getByRole('heading', { name: title }) });
  await expect(card('Garba Night').getByText('Registered')).toBeVisible();
  await expect(card('Garba Night').getByRole('button', { name: 'Register Members' })).toHaveCount(0);
  await expect(card('Holi Milan').getByRole('button', { name: 'Register Members' })).toBeVisible();

  await card('Diwali Puja').getByRole('button', { name: 'Register Members' }).click();
  await page.getByLabel(/Ram Patidar/).check();
  await page.getByRole('button', { name: 'Confirm Registration' }).click();
  await expect(card('Diwali Puja').getByText('Registered')).toBeVisible();
  expect(calls.find((c) => c.key === 'POST /event-registrations').body).toMatchObject({ eventId: 'ev-puja', familyId: 'NPSI-FAM-000001', memberIds: ['m-1'] });
});
