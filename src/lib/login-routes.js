// Pages that need a login. App.jsx guards them (logged-out visitors go to /login and come back afterwards), and a
// session that ends while one is open (logout elsewhere, idle timeout) sends the user to /login the same way.
export const LOGIN_ONLY_PREFIXES = [
  '/portal',
  '/admin',
  '/verify',
  '/sagun/workspace',
  '/community-services/become-donor',
  '/community-services/request-blood',
  '/community-services/blood-requests',
];

export const isLoginOnlyPath = (pathname) =>
  LOGIN_ONLY_PREFIXES.some((prefix) => pathname === prefix || String(pathname || '').startsWith(`${prefix}/`));

// The API's answer when the request carried no valid session. Other 401s (a wrong current password, a wrong
// login) are mistakes to show on the form, not a reason to leave the page.
export const SESSION_MISSING = 'Authentication required.';

export const loginPathFor = ({ pathname, search = '', hash = '' }) => `/login?returnTo=${encodeURIComponent(`${pathname}${search}${hash}`)}`;
