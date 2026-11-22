import { API } from './endpoints';
import { API_BASE_URL } from './apiBaseUrl';
import { apiFetch } from '@/api/base44Client';

// Super admin audit log (read only).
export const auditLogsApi = {
  list: async (filters = {}) => {
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined && value !== null)).toString();
    const response = await apiFetch(`${API_BASE_URL}${API.auditLogs}${query ? `?${query}` : ''}`, { credentials: 'include' });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw Object.assign(new Error(body.error || `AUDIT_HTTP_${response.status}`), { status: response.status });
    }
    return response.json();
  },
};
