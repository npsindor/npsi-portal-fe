import { API } from './endpoints';

const localApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const sanitizeDateStrings = (value) => {
  if (Array.isArray(value)) return value.map((entry) => sanitizeDateStrings(entry));
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, sanitizeDateStrings(entry)]));
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/.test(trimmed)) {
      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 19).replace('T', ' ');
      }
    }
  }
  return value;
};

const request = async (path, options = {}) => {
  const payload = options.body ? JSON.parse(options.body) : null;
  const sanitizedBody = payload ? sanitizeDateStrings(payload) : payload;

  const response = await fetch(`${localApiBaseUrl}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
    ...(sanitizedBody !== null ? { body: JSON.stringify(sanitizedBody) } : {}),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Local API request failed: ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
};

const createLocalEntities = () => new Proxy({}, {
  get: (_target, entity) => ({
    list: (order = '-createdAt', limit = 100) => request(`${API.entities.collection(entity)}?order=${encodeURIComponent(order)}&limit=${limit}`),
    filter: (filters = {}, order = '-createdAt', limit = 100) => request(`${API.entities.collection(entity)}?filter=${encodeURIComponent(JSON.stringify(filters))}&order=${encodeURIComponent(order)}&limit=${limit}`),
    create: (data) => request(API.entities.collection(entity), { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(API.entities.item(entity, id), { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(API.entities.item(entity, id), { method: 'DELETE' }),
    deleteMany: async (filters = {}) => {
      const records = await request(`${API.entities.collection(entity)}?filter=${encodeURIComponent(JSON.stringify(filters))}&limit=500`);
      await Promise.all(records.map((record) => request(API.entities.item(entity, record.id), { method: 'DELETE' })));
      return records;
    },
  }),
});

const createLocalAuth = () => ({
  loginViaEmailPassword: async (email, password) => {
    const result = await request(API.auth.sessions, { method: 'POST', body: JSON.stringify({ email, password }) });
    localStorage.setItem('base44_access_token', result.access_token);
    return result;
  },
  register: (emailOrData, password) => {
    const data = typeof emailOrData === 'object' ? emailOrData : { email: emailOrData, password };
    return request(API.auth.registrations, { method: 'POST', body: JSON.stringify(data) });
  },
  verifyOtp: async (data) => {
    const result = await request(API.auth.otpVerifications, { method: 'POST', body: JSON.stringify(data) });
    if (result.access_token) localStorage.setItem('base44_access_token', result.access_token);
    return result;
  },
  resendOtp: (email) => request(API.auth.otps, { method: 'POST', body: JSON.stringify({ email }) }),
  resetPasswordRequest: (email) => request(API.auth.passwordResets, { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (data) => request(API.auth.passwordResetConfirmations, { method: 'POST', body: JSON.stringify(data) }),
  changePassword: (data) => request(API.auth.password, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${localStorage.getItem('base44_access_token') || ''}` },
    body: JSON.stringify(data),
  }),
  me: () => request(API.auth.me, {
    headers: { Authorization: `Bearer ${localStorage.getItem('base44_access_token') || ''}` },
  }),
  logout: async () => {
    await request(API.auth.currentSession, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('base44_access_token') || ''}` },
    }).catch(() => {});
    localStorage.removeItem('base44_access_token');
  },
  setToken: (token) => {
    if (token) localStorage.setItem('base44_access_token', token);
  },
  redirectToLogin: (returnTo = '/') => {
    window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`;
  },
  loginWithProvider: () => {
    throw new Error('Google login is not configured for the local backend.');
  },
});

const createLocalUsers = () => ({
  inviteUser: (email, role = 'user', extra = {}) => request(API.auth.invitations, { method: 'POST', body: JSON.stringify({ email, role, ...extra }) }),
});

export const appClient = {
  entities: createLocalEntities(),
  auth: createLocalAuth(),
  users: createLocalUsers(),
  app: {
    getPublicSettings: async () => ({ id: 'local-app', public_settings: {} }),
  },
};

export const base44 = appClient;
export default appClient;
