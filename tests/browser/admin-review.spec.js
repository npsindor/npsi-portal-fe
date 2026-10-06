import { expect, test } from '@playwright/test';
import { ADMIN, mockApi } from './mock-api.js';

const application = {
  id: 'app-1',
  applicationId: 'NPSI-APP-2026-000041',
  status: 'PENDING_VERIFICATION',
  familyHeadName: 'Ram Patidar',
  familyName: 'Patidar',
  mobile: '9876500001',
  email: 'ram@example.com',
  city: 'Indore',
  district: 'Indore',
  membersData: [{ name: 'Ram Patidar', relationship: 'Self' }],
  submittedDate: '2026-10-01T10:00:00.000Z',
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
};

test('approving an application is one review call (no client-side family/member writes)', async ({ page }) => {
  const calls = await mockApi(page, {
    'GET /auth/me': ADMIN,
    'GET /applications': [application],
    'POST /applications/app-1/review': { application: { ...application, status: 'APPROVED' }, family: { familyId: 'NPSI-FAM-000055' }, members: [] },
  });
  await page.goto('/admin/applications');
  await page.getByRole('button', { name: 'Review' }).first().click();
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm Approve' }).click();
  await expect.poll(() => calls.filter((c) => c.key === 'POST /applications/app-1/review').length).toBe(1);
  const review = calls.find((c) => c.key === 'POST /applications/app-1/review');
  expect(review.body).toMatchObject({ decision: 'APPROVED', lang: 'en' });
  const writes = calls.filter((c) => !c.key.startsWith('GET ') && c.key !== 'POST /applications/app-1/review');
  expect(writes).toEqual([]);
});

test('admin tables load every row in pages of 500', async ({ page }) => {
  const calls = await mockApi(page, { 'GET /auth/me': ADMIN });
  await page.goto('/admin/applications');
  await expect.poll(() => calls.filter((c) => c.key === 'GET /applications').length).toBeGreaterThan(0);
  const list = calls.find((c) => c.key === 'GET /applications');
  expect(list.query).toContain('limit=500');
  expect(list.query).toContain('offset=0');
});
