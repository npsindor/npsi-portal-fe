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
  const token = localStorage.getItem('base44_access_token');

  const response = await fetch(`${localApiBaseUrl}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
    ...(sanitizedBody !== null ? { body: JSON.stringify(sanitizedBody) } : {}),
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
  const response = await fetch(`${localApiBaseUrl}/api/upload`, {
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

const createLocalEntities = () => new Proxy({}, {
  get: (_target, entity) => ({
    list: (order = '-createdAt', limit = 100) => request(`/api/entities/${entity}?order=${encodeURIComponent(order)}&limit=${limit}`),
    filter: (filters = {}, order = '-createdAt', limit = 100) => request(`/api/entities/${entity}?filter=${encodeURIComponent(JSON.stringify(filters))}&order=${encodeURIComponent(order)}&limit=${limit}`),
    create: (data) => request(`/api/entities/${entity}`, { method: 'POST', body: JSON.stringify(data) }),
    bulkCreate: (records = []) => request(`/api/entities/${entity}/bulk`, { method: 'POST', body: JSON.stringify({ records }) }),
    update: (id, data) => request(`/api/entities/${entity}/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/entities/${entity}/${id}`, { method: 'DELETE' }),
    deleteMany: async (filters = {}) => {
      const records = await request(`/api/entities/${entity}?filter=${encodeURIComponent(JSON.stringify(filters))}&limit=500`);
      await Promise.all(records.map((record) => request(`/api/entities/${entity}/${record.id}`, { method: 'DELETE' })));
      return records;
    },
  }),
});

const createLocalAuth = () => ({
  loginViaEmailPassword: async (email, password) => {
    const result = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    localStorage.setItem('base44_access_token', result.access_token);
    return result;
  },
  register: (emailOrData, password) => {
    const data = typeof emailOrData === 'object' ? emailOrData : { email: emailOrData, password };
    return request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) });
  },
  verifyOtp: async (data) => {
    const result = await request('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) });
    if (result.access_token) localStorage.setItem('base44_access_token', result.access_token);
    return result;
  },
  resendOtp: (email) => request('/api/auth/resend-otp', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPasswordRequest: (email) => request('/api/auth/reset-request', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (data) => request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  changePassword: (data) => request('/api/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/api/auth/me'),
  logout: async () => {
    await request('/api/auth/logout', { method: 'POST' }).catch(() => {});
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
  inviteUser: (email, role = 'user', extra = {}) => request('/api/auth/invite', { method: 'POST', body: JSON.stringify({ email, role, ...extra }) }),
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
  // table client-side just to filter/search it (see backend server/index.js).
  me: {
    family: () => request('/api/me/family'),
    feedback: () => request('/api/me/feedback'),
  },
  verifyFamily: (familyId) => request(`/api/verify/${encodeURIComponent(familyId)}`),
  trackApplication: (applicationId, mobile) =>
    request(`/api/track/application?applicationId=${encodeURIComponent(applicationId)}&mobile=${encodeURIComponent(mobile)}`),
  checkMobileTaken: (mobile) => request(`/api/check-mobile?mobile=${encodeURIComponent(mobile)}`),
  checkEmailTaken: (email) => request(`/api/check-email?email=${encodeURIComponent(email)}`),
  stats: () => request('/api/stats'),
};
