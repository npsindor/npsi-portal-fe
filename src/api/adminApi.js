import { API } from './endpoints';
import { API_BASE_URL } from './apiBaseUrl';
import { apiFetch } from '@/api/base44Client';

// Admin dashboard charts and role-based admin access (super admin only on the API).
const call = async (path, options = {}) => {
  const response = await apiFetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw Object.assign(new Error(body.error || `Request failed: ${response.status}`), { status: response.status });
  }
  return response.status === 204 ? null : response.json();
};
const id = encodeURIComponent;

export const adminApi = {
  charts: () => call(API.adminDashboardCharts),
  access: {
    list: () => call(API.adminAccess),
    candidates: (q) => call(`${API.adminAccess}/candidates?${new URLSearchParams({ q })}`),
    save: (userId, body) => call(`${API.adminAccess}/${id(userId)}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (userId) => call(`${API.adminAccess}/${id(userId)}`, { method: 'DELETE' }),
  },
};
