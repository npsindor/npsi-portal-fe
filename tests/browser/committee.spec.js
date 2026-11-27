import { expect, test } from '@playwright/test';
import { mockApi, NOT_LOGGED_IN } from './mock-api.js';

const profiles = [
  ['Shri Gajanand Ji Patidar', 'श्री गजानंद जी पाटीदार'],
  ['Shri Sukhdev Ji Patidar', 'श्री सुखदेव जी पाटीदार'],
  ['Shri Ramesh Ji Patidar', 'श्री रमेश जी पाटीदार'],
  ['Shri Sevkram Ji Patidar', 'श्री सेवकराम जी पाटीदार'],
  ['Shri Mahesh Ji Patidar', 'श्री महेश जी पाटीदार'],
  ['Shri Ramchandra Ji Patidar', 'श्री रामचन्द्र जी पाटीदार'],
].map(([nameEn, nameHi], index) => ({ id: `member-${index}`, nameEn, nameHi, photoUrl: null, displayOrder: index + 1, active: true }));

for (const [width, columns] of [[390, 1], [768, 2], [1440, 3]]) {
  test(`senior committee shows six real-data placeholders in ${columns} columns at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /senior-discipline-committee': profiles });
    await page.goto('/about');
    const section = page.locator('section[aria-labelledby="senior-discipline-title"]');
    // The heading follows the chosen language (English by default).
    await expect(page.getByRole('heading', { name: 'Guiding Generations. Inspiring Futures.' })).toBeVisible();
    await expect(section.locator('article')).toHaveCount(6);
    expect(await section.locator('div.grid').evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(' ').length)).toBe(columns);
    for (const { nameEn } of profiles) await expect(section.getByRole('heading', { name: nameEn })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
