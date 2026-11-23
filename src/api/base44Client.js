import { API } from './endpoints';
import { API_BASE_URL } from './apiBaseUrl';
import { getRecaptchaToken } from '../lib/recaptcha';
import { rehostUploads } from './uploadUrls';
import { isLoginOnlyPath, loginPathFor, SESSION_MISSING } from '../lib/login-routes';

const localApiBaseUrl = API_BASE_URL;

// The session is an httpOnly cookie set by the API on login; `credentials: 'include'`
// sends it. The token is never stored where page scripts could read it.
// A request that never reached the API (offline, DNS, server down) fails with a different message in every browser
// ("Failed to fetch" in Chrome, "NetworkError…" in Firefox, "Load failed" in Safari); turn it into one clear message.
export const NETWORK_ERROR = 'Could not reach the server. Check your internet connection and try again. / सर्वर से संपर्क नहीं हो सका। इंटरनेट कनेक्शन जाँचें और फिर कोशिश करें।';
export const apiFetch = async (url, options) => {
  try {
    const response = await fetch(url, options);
    if (response.status === 401 && String(url).startsWith(localApiBaseUrl)) sessionEnded(String(url).slice(localApiBaseUrl.length), response.clone());
    // Image links in API answers point at this site's API, whatever host they were uploaded through.
    if (String(url).startsWith(localApiBaseUrl) && /json/i.test(response.headers.get('content-type') || '')) {
      const json = response.json.bind(response);
      response.json = async () => rehostUploads(await json(), localApiBaseUrl);
    }
    return response;
  } catch (cause) {
    if (cause?.name === 'AbortError') throw cause;
    const error = new Error(NETWORK_ERROR);
    error.network = true;
    error.cause = cause;
    throw error;
  }
};

const request = async (path, options = {}) => {
  const response = await apiFetch(`${localApiBaseUrl}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.error || `Local API request failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.status === 204 ? null : response.json();
};

// A session that ended (logout elsewhere, idle timeout, another database) while a login-only page is open: go to
// login and come back here afterwards, instead of failing every action. Every API module goes through apiFetch,
// so this covers all of them. Only the API's "no session" answer counts: a wrong current password is also a 401
// and must stay on the form. The session check and the login calls never redirect.
const sessionEnded = (path, response) => {
  if (typeof window === 'undefined' || path.startsWith(API.auth.me) || path.startsWith(API.auth.sessions)) return;
  if (!isLoginOnlyPath(window.location.pathname)) return;
  response.json().then((body) => {
    if (body?.error === SESSION_MISSING && isLoginOnlyPath(window.location.pathname)) window.location.assign(loginPathFor(window.location));
  }, () => {});
};

// Multipart upload — kept separate from request() above, which always
// JSON-encodes the body; a browser-built FormData needs its own
// automatically-generated multipart Content-Type (with boundary), so this
// deliberately does not set one.
// Same limits as the API's POST /uploads (5 MB; JPEG, PNG, WebP, GIF), checked before sending the file so a
// too-large or wrong file fails at once with a clear message instead of after a long upload.
export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
const UPLOAD_TYPES = ['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png', 'image/x-png', 'image/webp', 'image/gif'];
const uploadPublicFile = async ({ file }) => {
  if (!file) throw new Error('Choose a photo first. / पहले फोटो चुनें।');
  if (file.type && !UPLOAD_TYPES.includes(file.type.toLowerCase())) throw new Error('Only JPG, PNG, WebP or GIF images can be uploaded. / केवल JPG, PNG, WebP या GIF फोटो अपलोड करें।');
  if (file.size > UPLOAD_MAX_BYTES) throw new Error('The photo is larger than 5 MB. Please choose a smaller one. / फोटो 5 MB से बड़ी है, कृपया छोटी फोटो चुनें।');
  const formData = new FormData();
  // Required by the API for uploads without a login (registration forms); ignored for logged-in members.
  formData.append('recaptchaToken', await getRecaptchaToken('upload'));
  formData.append('file', file);
  const response = await apiFetch(`${localApiBaseUrl}${API.uploads}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Upload failed: ${response.status}`);
  }
  return response.json();
};

// The header chip, the page and its widgets all ask for "my family" when a portal page opens.
// Calls made while one is in flight (or within a second of it) share that one request; anything
// later fetches fresh, so changes to the family show up as before.
let myFamilyRequest = null;
let myFamilyAt = 0;
const sharedMyFamily = () => {
  if (myFamilyRequest && Date.now() - myFamilyAt < 1000) return myFamilyRequest;
  myFamilyAt = Date.now();
  myFamilyRequest = request(API.me.family).catch((error) => {
    myFamilyRequest = null;
    throw error;
  });
  myFamilyRequest.then(() => { myFamilyAt = Date.now(); }, () => {});
  return myFamilyRequest;
};

const PAGE_SIZE = 500; // the backend's maximum limit

const listQuery = (filters, order, limit) =>
  new URLSearchParams({ ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== undefined && value !== null)), order, limit: String(limit) }).toString();

const createLocalEntities = () => new Proxy({}, {
  get: (_target, entity) => ({
    list: (order = '-createdAt', limit = 100) => request(`${API.entities.collection(entity)}?${listQuery({}, order, limit)}`),
    // Every row, fetched 500 at a time (admin tables: nothing is silently cut off).
    listAll: async (order = '-createdAt', filters = {}) => {
      const rows = [];
      for (let offset = 0; ; offset += PAGE_SIZE) {
        const page = await request(`${API.entities.collection(entity)}?${listQuery(filters, order, PAGE_SIZE)}&offset=${offset}`);
        rows.push(...page);
        if (page.length < PAGE_SIZE) return rows;
      }
    },
    // Each filter is a query parameter the resource accepts (e.g. familyId, status).
    filter: (filters = {}, order = '-createdAt', limit = 100) => request(`${API.entities.collection(entity)}?${listQuery(filters, order, limit)}`),
    create: (data) => request(API.entities.collection(entity), { method: 'POST', body: JSON.stringify(data) }),
    bulkCreate: (records = []) => request(API.entities.batch(entity), { method: 'POST', body: JSON.stringify({ records }) }),
    update: (id, data) => request(API.entities.item(entity, id), { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(API.entities.item(entity, id), { method: 'DELETE' }),
    // Admin decision on an application or transfer request: { decision: 'APPROVED' | 'REJECTED' | 'CORRECTION_REQUIRED', remarks, lang }.
    review: (id, body) => request(API.entities.review(entity, id), { method: 'POST', body: JSON.stringify(body) }),
    deleteMany: async (filters = {}) => {
      const records = await request(`${API.entities.collection(entity)}?${listQuery(filters, '-createdAt', 500)}`);
      await Promise.all(records.map((record) => request(API.entities.item(entity, record.id), { method: 'DELETE' })));
      return records;
    },
  }),
});

const createLocalAuth = () => ({
  // portal: 'FAMILY' (Family Member Login) or 'STUDENT' (Student Login). The server checks it against the account's
  // own registration records and refuses the other portal.
  loginViaEmailPassword: async (email, password, portal = 'FAMILY') => {
    // The API sets the session cookie. Public auth forms send a reCAPTCHA v3 token (the server verifies it).
    const recaptchaToken = await getRecaptchaToken('login');
    return request(API.auth.sessions, { method: 'POST', body: JSON.stringify({ email, password, portal, recaptchaToken }) });
  },
  register: (emailOrData, password) => {
    const data = typeof emailOrData === 'object' ? emailOrData : { email: emailOrData, password };
    return request(API.auth.registrations, { method: 'POST', body: JSON.stringify(data) });
  },
  // The emailed code: a new account's first verification, or an administrator's second sign-in step (`email` may be
  // the mobile number the administrator logged in with). The API sets the session cookie.
  verifyOtp: async (data) =>
    request(API.auth.otpVerifications, { method: 'POST', body: JSON.stringify({ ...data, recaptchaToken: await getRecaptchaToken('verify_code') }) }),
  resendOtp: async (email) => request(API.auth.otps, { method: 'POST', body: JSON.stringify({ email, recaptchaToken: await getRecaptchaToken('resend_code') }) }),
  // Mobile OTP (WhatsApp → SMS → email fallback): { mobile, purpose: 'REGISTER' | 'RESET', email?, recaptchaToken? }.
  requestMobileOtp: (data) => request(API.auth.mobileOtps, { method: 'POST', body: JSON.stringify(data) }),
  // → { verificationToken } for registerWithMobile / resetPassword({ phone, verificationToken, newPassword }).
  verifyMobileOtp: (data) => request(API.auth.mobileOtpVerifications, { method: 'POST', body: JSON.stringify(data) }),
  // The API sets the session cookie.
  registerWithMobile: (data) => request(API.auth.mobileRegistrations, { method: 'POST', body: JSON.stringify(data) }),
  resetPasswordRequest: async (email) => request(API.auth.passwordResets, { method: 'POST', body: JSON.stringify({ email, recaptchaToken: await getRecaptchaToken('password_reset') }) }),
  resetPassword: (data) => request(API.auth.passwordResetConfirmations, { method: 'POST', body: JSON.stringify(data) }),
  changePassword: (data) => request(API.auth.password, { method: 'PUT', body: JSON.stringify(data) }),
  me: () => request(API.auth.me),
  // The logged-in user or null, without a 401 in the browser console for visitors. An API that doesn't have this
  // route yet (404) falls back to /auth/me, where a 401 means "not logged in".
  currentSession: async () => {
    try {
      return (await request(API.auth.currentSession)).user || null;
    } catch (error) {
      if (error.status !== 404 && error.status !== 405) throw error;
      try { return await request(API.auth.me); } catch (fallback) { if (fallback.status === 401 || fallback.status === 403) return null; throw fallback; }
    }
  },
  // Own profile: { fullName, phone, photoUrl } (photoUrl from UploadPublicFile).
  updateMe: (data) => request(API.auth.me, { method: 'PATCH', body: JSON.stringify(data) }),
  logout: async () => {
    await request(API.auth.currentSession, { method: 'DELETE' }).catch(() => {});
    localStorage.removeItem('base44_access_token');
  },
  // Ends every session of this user, on all devices (this one included).
  logoutEverywhere: async () => {
    await request(API.auth.sessions, { method: 'DELETE' });
    localStorage.removeItem('base44_access_token');
  },
  redirectToLogin: (returnTo = '/') => {
    // Never redirect to login from login itself, and never let the login
    // page become the "return to" target — both would compound into an
    // ever-growing nested returnTo chain across repeated auth checks.
    if (window.location.pathname === '/login') return;
    let target = returnTo;
    try {
      target = new URL(returnTo, window.location.origin).pathname;
    } catch {
      target = '/';
    }
    if (target.startsWith('/login') || target.startsWith('/register-account')) {
      window.location.href = '/login';
      return;
    }
    window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`;
  },
  loginWithProvider: () => {
    throw new Error('Google login is not configured for the local backend.');
  },
});

const createLocalUsers = () => ({
  inviteUser: (email, role = 'user', extra = {}) => request(API.auth.invitations, { method: 'POST', body: JSON.stringify({ email, role, ...extra }) }),
});

const API_PREFIX_SAFAR = API.safar;

export const base44 = {
  sagun: {
    schema: () => request(`${API.sagun}/schema`),
    mine: () => request(`${API.sagun}/me`),
    browse: (query = {}) => request(`${API.sagun}/profiles?${new URLSearchParams(Object.entries(query).filter(([, value]) => value !== '' && value !== undefined))}`),
    detail: id => request(`${API.sagun}/profiles/${encodeURIComponent(id)}`),
    save: (id, data, action, ownerUserId, memberId, category) => request(`${API.sagun}/profiles${id ? '/' + encodeURIComponent(id) : ''}`, { method: id ? 'PATCH' : 'POST', body: JSON.stringify({ data, action, ...(ownerUserId ? { ownerUserId } : {}), ...(memberId ? { memberId } : {}), ...(category ? { category } : {}) }) }),
    eligibleMembers: () => request(`${API.sagun}/eligible-members`),
    memberPrefill: memberId => request(`${API.sagun}/eligible-members/${encodeURIComponent(memberId)}`),
    adminStats: () => request(`${API.sagun}/admin/stats`),
    adminList: (query = {}) => request(`${API.sagun}/admin/profiles?${new URLSearchParams(Object.entries(query).filter(([, value]) => value !== '' && value !== undefined && value !== null))}`),
    adminEdit: (id, data, remarks) => request(`${API.sagun}/admin/profiles/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ data, remarks }) }),
    logs: id => request(`${API.sagun}/admin/profiles/${encodeURIComponent(id)}/logs`),
    settings: () => request(`${API.sagun}/admin/settings`),
    updateSettings: values => request(`${API.sagun}/admin/settings`, { method: 'PUT', body: JSON.stringify(values) }),
    review: (id, status, notes) => request(`${API.sagun}/admin/profiles/${encodeURIComponent(id)}/review`, { method: 'PATCH', body: JSON.stringify({ status, notes }) }),
    deactivate: id => request(`${API.sagun}/profiles/${encodeURIComponent(id)}/deactivation`, { method: 'PATCH' }),
    withdrawConsent: id => request(`${API.sagun}/profiles/${encodeURIComponent(id)}/consent-withdrawal`, { method: 'PATCH' }),
    remove: id => request(`${API.sagun}/profiles/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    admin: () => request(`${API.sagun}/admin`),
    configure: overrides => request(`${API.sagun}/admin/schema`, { method: 'PATCH', body: JSON.stringify({ overrides }) }),
    inquire: (id, message, consent) => request(`${API.sagun}/profiles/${encodeURIComponent(id)}/inquiries`, { method: 'POST', body: JSON.stringify({ message, consent }) }),
    inquiryAction: (id, action, shareSagun) => request(`${API.sagun}/inquiries/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ action, shareSagun }) }),
    upload: async (id, kind, file, consent) => { const body = new FormData(); body.append('file', file); body.append('consent', String(consent)); const response = await apiFetch(`${localApiBaseUrl}${API.sagun}/profiles/${encodeURIComponent(id)}/files/${encodeURIComponent(kind)}`, { method: 'POST', credentials: 'include', body }); if (!response.ok) throw new Error((await response.json()).error || 'SAGUN_FILE'); return response.json(); },
    file: async id => { const response = await apiFetch(`${localApiBaseUrl}${API.sagun}/files/${encodeURIComponent(id)}`, { credentials: 'include' }); if (!response.ok) throw new Error('SAGUN_NOT_FOUND'); return response.blob(); },
    deleteFile: id => request(`${API.sagun}/files/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  },
  eventFinance: {
    list: () => request(API.eventFinance),
    detail: id => request(`${API.eventFinance}/${encodeURIComponent(id)}`),
    categories: () => request(`${API.eventFinance}/admin/categories`),
    saveCategory: (data, id) => request(`${API.eventFinance}/admin/categories${id ? '/' + encodeURIComponent(id) : ''}`, { method: id ? 'PATCH' : 'POST', body: JSON.stringify(data) }),
    removeCategory: id => request(`${API.eventFinance}/admin/categories/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    save: (eventId, kind, data, id) => request(`${API.eventFinance}/admin/events/${encodeURIComponent(eventId)}/${kind}${id ? '/' + encodeURIComponent(id) : ''}`, { method: id ? 'PATCH' : 'POST', body: JSON.stringify(data) }),
    review: (eventId, kind, id, status) => request(`${API.eventFinance}/admin/events/${encodeURIComponent(eventId)}/${kind}/${encodeURIComponent(id)}/review`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    remove: (eventId, kind, id) => request(`${API.eventFinance}/admin/events/${encodeURIComponent(eventId)}/${kind}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    roster: eventId => request(`${API.eventFinance}/admin/events/${encodeURIComponent(eventId)}/roster`),
    saveRoster: (eventId, data, id) => request(`${API.eventFinance}/admin/events/${encodeURIComponent(eventId)}/roster${id ? '/' + encodeURIComponent(id) : ''}`, { method: id ? 'PATCH' : 'POST', body: JSON.stringify(data) }),
    removeRoster: (eventId, id) => request(`${API.eventFinance}/admin/events/${encodeURIComponent(eventId)}/roster/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    saveTeam: (eventId, data, id) => request(`${API.eventFinance}/admin/events/${encodeURIComponent(eventId)}/teams${id ? '/' + encodeURIComponent(id) : ''}`, { method: id ? 'PATCH' : 'POST', body: JSON.stringify(data) }),
    removeTeam: (eventId, id) => request(`${API.eventFinance}/admin/events/${encodeURIComponent(eventId)}/teams/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    saveResponsibility: (eventId, data, id) => request(`${API.eventFinance}/admin/events/${encodeURIComponent(eventId)}/responsibilities${id ? '/' + encodeURIComponent(id) : ''}`, { method: id ? 'PATCH' : 'POST', body: JSON.stringify(data) }),
    members: q => request(`${API.eventFinance}/members?q=${encodeURIComponent(q)}`),
    importRoster: (eventId, data) => request(`${API.eventFinance}/admin/events/${encodeURIComponent(eventId)}/roster/import`, { method: 'POST', body: JSON.stringify(data) }),
    // Who created / changed which finance record and when (admins); entityId narrows it to one record.
    history: (eventId, entityId) => request(`${API.eventFinance}/admin/events/${encodeURIComponent(eventId)}/history${entityId ? `?entityId=${encodeURIComponent(entityId)}` : ''}`),
  },
  sehat: {
    public: () => request(`${API.sehat}/public`),
    mine: () => request(`${API.sehat}/me`),
    mr: data => request(`${API.sehat}/mrs`, { method: 'POST', body: JSON.stringify(data) }),
    create: data => request(`${API.sehat}/requests`, { method: 'POST', body: JSON.stringify(data) }),
    close: id => request(`${API.sehat}/requests/${encodeURIComponent(id)}/close`, { method: 'PATCH' }),
    action: (id, action) => request(`${API.sehat}/requests/${encodeURIComponent(id)}/mr-action`, { method: 'PATCH', body: JSON.stringify({ action }) }),
    report: data => request(`${API.sehat}/reports`, { method: 'POST', body: JSON.stringify(data) }),
    admin: () => request(`${API.sehat}/admin`),
    save: (type, id, data) => request(`${API.sehat}/admin/${type}${id ? '/' + encodeURIComponent(id) : ''}`, { method: id ? 'PATCH' : 'POST', body: JSON.stringify(data) }),
    remove: (type, id) => request(`${API.sehat}/admin/${type}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    retry: id => request(`${API.sehat}/admin/notifications/${encodeURIComponent(id)}/retry`, { method: 'POST' }),
  },
  safar: {
    capabilities: () => request(`${API_PREFIX_SAFAR}/capabilities`),
    mine: () => request(`${API_PREFIX_SAFAR}/me`),
    create: data => request(`${API_PREFIX_SAFAR}/entries`, { method: 'POST', body: JSON.stringify(data) }),
    cancel: id => request(`${API_PREFIX_SAFAR}/entries/${encodeURIComponent(id)}/cancellation`, { method: 'PATCH' }),
    decide: (id, decision) => request(`${API_PREFIX_SAFAR}/matches/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ decision }) }),
  },
  contactInfo: { list: ({ limit = 25, offset = 0 } = {}) => request(`${API.contactInfo}?${new URLSearchParams({ limit, offset })}`), create: (data) => request(API.contactInfo, { method: 'POST', body: JSON.stringify(data) }) },
  entities: createLocalEntities(),
  auth: createLocalAuth(),
  users: createLocalUsers(),
  // Account-first registration with UPI payment proof, and the admin payment review.
  registrations: {
    mine: () => request(API.me.registrations),
    submit: (data) => request(API.me.registrations, { method: 'POST', body: JSON.stringify(data) }),
    resubmit: (id, data) => request(API.me.registration(id), { method: 'PUT', body: JSON.stringify(data) }),
    completion: () => request(API.me.profileCompletion),
    uploadScreenshot: async (file) => {
      const body = new FormData();
      body.append('file', file);
      const response = await apiFetch(`${localApiBaseUrl}${API.me.paymentScreenshots}`, { method: 'POST', credentials: 'include', body });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw Object.assign(new Error(result.error || 'Upload failed'), { status: response.status });
      return result;
    },
    payments: (status = '', limit = 200) => request(`${API.registrationPayments}?${new URLSearchParams({ limit: String(limit), ...(status ? { status } : {}) })}`),
    reviewPayment: (id, body) => request(API.registrationPaymentReview(id), { method: 'POST', body: JSON.stringify(body) }),
    editPayment: (id, body) => request(API.registrationPayment(id), { method: 'PATCH', body: JSON.stringify(body) }),
    deletePayment: (id) => request(API.registrationPayment(id), { method: 'DELETE' }),
    screenshot: async (id) => {
      const response = await apiFetch(`${localApiBaseUrl}${API.registrationPaymentScreenshot(id)}`, { credentials: 'include' });
      if (!response.ok) throw Object.assign(new Error('Record not found'), { status: response.status });
      return response.blob();
    },
  },
  addressOptions: {
    list: (kind, city) => request(`${API.addressOptions}?${new URLSearchParams({ kind, ...(city ? { city } : {}) })}`),
    all: () => request(API.addressOptionsAll),
    create: (data) => request(API.addressOptions, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(API.addressOption(id), { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id) => request(API.addressOption(id), { method: 'DELETE' }),
  },
  // Homepage "Community highlights" slides. The public gets live slides; an admin session gets all of them.
  homeHighlights: {
    list: (slider) => request(slider ? `${API.homeHighlights}?${new URLSearchParams({ slider })}` : API.homeHighlights),
    create: (data) => request(API.homeHighlights, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(API.homeHighlight(id), { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id) => request(API.homeHighlight(id), { method: 'DELETE' }),
  },
  // Community Services page posts. The public gets active posts; an admin session gets all of them.
  communityPosts: {
    list: (section) => request(section ? `${API.communityPosts}?${new URLSearchParams({ section })}` : API.communityPosts),
    create: (data) => request(API.communityPosts, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(API.communityPost(id), { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id) => request(API.communityPost(id), { method: 'DELETE' }),
  },
  // Admin-managed content of the public menu pages. The public gets active blocks; an admin session gets all of them.
  pageBlocks: {
    list: (page) => request(page ? `${API.pageBlocks}?${new URLSearchParams({ page })}` : API.pageBlocks),
    create: (data) => request(API.pageBlocks, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(API.pageBlock(id), { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id) => request(API.pageBlock(id), { method: 'DELETE' }),
  },
  seniorDisciplineCommittee: {
    list: () => request(API.seniorDisciplineCommittee),
    all: () => request(API.seniorDisciplineCommitteeAll),
    create: (data) => request(API.seniorDisciplineCommittee, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(API.seniorDisciplineCommitteeMember(id), { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id) => request(API.seniorDisciplineCommitteeMember(id), { method: 'DELETE' }),
  },
  integrations: {
    Core: {
      UploadPublicFile: uploadPublicFile,
    },
  },
  // Narrow, purpose-built endpoints that replace fetching a whole sensitive
  // table client-side just to filter/search it.
  me: {
    family: () => sharedMyFamily(),
    feedback: () => request(API.me.feedback),
    // The family's event registrations, cancelled ones included.
    eventRegistrations: () => request(API.me.eventRegistrations),
    // Transfer requests this member filed that an admin hasn't decided yet.
    transferRequests: () => request(API.me.transferRequests),
  },
  verifyFamily: (familyId) => request(API.familyVerification(familyId)),
  trackApplication: (applicationId, mobile) =>
    request(API.applicationStatus(applicationId, mobile)),
  checkMobileTaken: (mobile) => request(API.mobileAvailability(mobile)),
  checkEmailTaken: (email) => request(API.emailAvailability(email)),
  stats: () => request(API.stats),
};
