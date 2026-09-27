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
    list: (order = '-createdAt', limit = 100) => request(`/api/entities/${entity}?order=${encodeURIComponent(order)}&limit=${limit}`),
    filter: (filters = {}, order = '-createdAt', limit = 100) => request(`/api/entities/${entity}?filter=${encodeURIComponent(JSON.stringify(filters))}&order=${encodeURIComponent(order)}&limit=${limit}`),
    create: (data) => request(`/api/entities/${entity}`, { method: 'POST', body: JSON.stringify(data) }),
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
  changePassword: (data) => request('/api/auth/change-password', {
    method: 'POST',
    headers: { Authorization: `Bearer ${localStorage.getItem('base44_access_token') || ''}` },
    body: JSON.stringify(data),
  }),
  me: () => request('/api/auth/me', {
    headers: { Authorization: `Bearer ${localStorage.getItem('base44_access_token') || ''}` },
  }),
  logout: async () => {
    await request('/api/auth/logout', {
      method: 'POST',
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
  inviteUser: (email, role = 'user', extra = {}) => request('/api/auth/invite', { method: 'POST', body: JSON.stringify({ email, role, ...extra }) }),
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
