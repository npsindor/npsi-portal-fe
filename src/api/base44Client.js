import { API } from './endpoints';

const localApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const request = async (path, options = {}) => {
  const token = localStorage.getItem('base44_access_token');

  const response = await fetch(`${localApiBaseUrl}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

// Multipart upload — kept separate from request() above, which always
// JSON-encodes the body; a browser-built FormData needs its own
// automatically-generated multipart Content-Type (with boundary), so this
// deliberately does not set one.
const uploadPublicFile = async ({ file }) => {
  const token = localStorage.getItem('base44_access_token');
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${localApiBaseUrl}${API.uploads}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Upload failed: ${response.status}`);
  }
  return response.json();
};

const listQuery = (filters, order, limit) =>
  new URLSearchParams({ ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== undefined && value !== null)), order, limit: String(limit) }).toString();

const createLocalEntities = () => new Proxy({}, {
  get: (_target, entity) => ({
    list: (order = '-createdAt', limit = 100) => request(`${API.entities.collection(entity)}?${listQuery({}, order, limit)}`),
    // Each filter is a query parameter the resource accepts (e.g. familyId, status).
    filter: (filters = {}, order = '-createdAt', limit = 100) => request(`${API.entities.collection(entity)}?${listQuery(filters, order, limit)}`),
    create: (data) => request(API.entities.collection(entity), { method: 'POST', body: JSON.stringify(data) }),
    bulkCreate: (records = []) => request(API.entities.batch(entity), { method: 'POST', body: JSON.stringify({ records }) }),
    update: (id, data) => request(API.entities.item(entity, id), { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(API.entities.item(entity, id), { method: 'DELETE' }),
    deleteMany: async (filters = {}) => {
      const records = await request(`${API.entities.collection(entity)}?${listQuery(filters, '-createdAt', 500)}`);
      await Promise.all(records.map((record) => request(API.entities.item(entity, record.id), { method: 'DELETE' })));
      return records;
    },
  }),
});

const createLocalAuth = () => ({
  loginViaEmailPassword: async (email, password) => {
    const result = await request(API.auth.sessions, { method: 'POST', body: JSON.stringify({ email, password }) });
    localStorage.setItem('base44_access_token', result.accessToken);
    return result;
  },
  register: (emailOrData, password) => {
    const data = typeof emailOrData === 'object' ? emailOrData : { email: emailOrData, password };
    return request(API.auth.registrations, { method: 'POST', body: JSON.stringify(data) });
  },
  verifyOtp: async (data) => {
    const result = await request(API.auth.otpVerifications, { method: 'POST', body: JSON.stringify(data) });
    if (result.accessToken) localStorage.setItem('base44_access_token', result.accessToken);
    return result;
  },
  resendOtp: (email) => request(API.auth.otps, { method: 'POST', body: JSON.stringify({ email }) }),
  resetPasswordRequest: (email) => request(API.auth.passwordResets, { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (data) => request(API.auth.passwordResetConfirmations, { method: 'POST', body: JSON.stringify(data) }),
  changePassword: (data) => request(API.auth.password, { method: 'PUT', body: JSON.stringify(data) }),
  me: () => request(API.auth.me),
  logout: async () => {
    await request(API.auth.currentSession, { method: 'DELETE' }).catch(() => {});
    localStorage.removeItem('base44_access_token');
  },
  setToken: (token) => {
    if (token) localStorage.setItem('base44_access_token', token);
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

export const base44 = {
  entities: createLocalEntities(),
  auth: createLocalAuth(),
  users: createLocalUsers(),
  integrations: {
    Core: {
      UploadPublicFile: uploadPublicFile,
    },
  },
  app: {
    getPublicSettings: async () => ({ id: 'local-app', public_settings: {} }),
  },
  // Narrow, purpose-built endpoints that replace fetching a whole sensitive
  // table client-side just to filter/search it.
  me: {
    family: () => request(API.me.family),
    feedback: () => request(API.me.feedback),
  },
  verifyFamily: (familyId) => request(API.familyVerification(familyId)),
  trackApplication: (applicationId, mobile) =>
    request(API.applicationStatus(applicationId, mobile)),
  checkMobileTaken: (mobile) => request(API.mobileAvailability(mobile)),
  checkEmailTaken: (email) => request(API.emailAvailability(email)),
  stats: () => request(API.stats),
};
