import { publicNavigation } from '../../src/lib/public-navigation.js';
import { publicHindi } from '../../src/lib/public-copy.js';

// The header groups some pages in dropdowns (Services, Community, Contact). These helpers return the visible
// link for a page, opening its dropdown first when the page lives in one.
export const menuGroupOf = (label) => publicNavigation.find((item) => item.items?.some(([child]) => child === label))?.label;
export async function navLink(page, label, { hi = false, text } = {}) {
  const nav = page.locator('#public-navigation');
  const group = menuGroupOf(label);
  const name = text || (hi ? publicHindi[label] || label : label);
  if (!group) return nav.getByRole('link', { name, exact: true });
  const summaryText = hi ? publicHindi[group] || group : group;
  const details = nav.locator('details').filter({ has: page.locator('summary', { hasText: summaryText }) });
  if ((await details.getAttribute('open')) === null) await details.locator('summary').click();
  return details.getByRole('link', { name, exact: true });
}
