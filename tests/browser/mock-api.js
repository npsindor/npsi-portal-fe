// Answers /api/v1 calls for a browser test and records what the app sent.
// `routes` maps "METHOD /path" (path without query) to a response body or to
// { status, body }; anything else returns an empty list (GET) or 404.
export const mockApi = async (page, routes = {}) => {
  // A returning visitor: the launch curtain, Garba video popup and feedback
  // prompt were already shown this session, so nothing covers the page.
  await page.addInitScript(() => {
    for (const key of ['nps_curtain_opened', 'nps_garba_popup_seen', 'pss_feedback_shown']) sessionStorage.setItem(key, '1');
  });
  const calls = [];
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api\/v1/, '');
    const key = `${request.method()} ${path}`;
    const body = request.postData();
    calls.push({ key, query: url.search, body: body && request.headers()['content-type']?.includes('json') ? JSON.parse(body) : body });
    const answer = routes[key];
    if (answer === undefined) {
      return route.fulfill(request.method() === 'GET' ? { json: [] } : { status: 404, json: { error: 'Not mocked' } });
    }
    const { status = 200, body: payload = answer, headers } = answer && typeof answer === 'object' && 'status' in answer ? answer : { body: answer };
    return route.fulfill({ status, headers, json: payload });
  });
  return calls;
};

export const ADMIN = { id: 'u-admin', email: 'admin@example.com', fullName: 'Admin', phone: null, role: 'admin', photoUrl: null };
export const NOT_LOGGED_IN = { status: 401, body: { error: 'Authentication required.' } };
