import { API } from './endpoints';
import { API_BASE_URL } from './apiBaseUrl';
import { apiFetch } from '@/api/base44Client';

// Sagun talks directly to this portal's NestJS REST API. It does not use a
// third-party backend client, identity provider, database, storage or hosting.
const apiBase = API_BASE_URL;
const request = async (path, options = {}) => {
  const response = await apiFetch(`${apiBase}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw Object.assign(new Error(body.error || `Shagun API request failed: ${response.status}`), { status: response.status });
  }
  return response.status === 204 ? null : response.json();
};
const query = values => new URLSearchParams(Object.entries(values).filter(([, value]) => value !== '' && value !== undefined && value !== null));

export const sagunApi = { sagun: {
  schema: () => request(`${API.sagun}/schema`),
  mine: () => request(`${API.sagun}/me`),
  browse: (filters = {}) => request(`${API.sagun}/profiles?${query(filters)}`),
  detail: id => request(`${API.sagun}/profiles/${encodeURIComponent(id)}`),
  save: (id, data, action, ownerUserId, memberId, category) => request(`${API.sagun}/profiles${id ? `/${encodeURIComponent(id)}` : ''}`, {
    method: id ? 'PATCH' : 'POST',
    body: JSON.stringify({ data, action, ...(ownerUserId ? { ownerUserId } : {}), ...(memberId ? { memberId } : {}), ...(category ? { category } : {}) }),
  }),
  eligibleMembers: () => request(`${API.sagun}/eligible-members`),
  memberPrefill: memberId => request(`${API.sagun}/eligible-members/${encodeURIComponent(memberId)}`),
  admin: () => request(`${API.sagun}/admin`),
  adminStats: () => request(`${API.sagun}/admin/stats`),
  adminList: (filters = {}) => request(`${API.sagun}/admin/profiles?${query(filters)}`),
  adminEdit: (id, data, remarks) => request(`${API.sagun}/admin/profiles/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ data, remarks }) }),
  logs: id => request(`${API.sagun}/admin/profiles/${encodeURIComponent(id)}/logs`),
  settings: () => request(`${API.sagun}/admin/settings`),
  updateSettings: values => request(`${API.sagun}/admin/settings`, { method: 'PUT', body: JSON.stringify(values) }),
  review: (id, status, notes) => request(`${API.sagun}/admin/profiles/${encodeURIComponent(id)}/review`, { method: 'PATCH', body: JSON.stringify({ status, notes }) }),
  deactivate: id => request(`${API.sagun}/profiles/${encodeURIComponent(id)}/deactivation`, { method: 'PATCH' }),
  withdrawConsent: id => request(`${API.sagun}/profiles/${encodeURIComponent(id)}/consent-withdrawal`, { method: 'PATCH' }),
  remove: id => request(`${API.sagun}/profiles/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  configure: overrides => request(`${API.sagun}/admin/schema`, { method: 'PATCH', body: JSON.stringify({ overrides }) }),
  inquire: (id, message, consent) => request(`${API.sagun}/profiles/${encodeURIComponent(id)}/inquiries`, { method: 'POST', body: JSON.stringify({ message, consent }) }),
  inquiryAction: (id, action, shareSagun) => request(`${API.sagun}/inquiries/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ action, shareSagun }) }),
  // onProgress(0..100) reports upload progress (XMLHttpRequest: fetch can't). Resolves only after the server stored the file.
  upload: async (id, kind, file, consent, onProgress) => {
    const body = new FormData(); body.append('file', file); body.append('consent', String(consent));
    if (onProgress && typeof XMLHttpRequest !== 'undefined') {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${apiBase}${API.sagun}/profiles/${encodeURIComponent(id)}/files/${encodeURIComponent(kind)}`);
        xhr.withCredentials = true;
        xhr.upload.onprogress = (event) => { if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100)); };
        xhr.onerror = () => reject(new Error('SAGUN_FILE_NETWORK'));
        xhr.onload = () => {
          let json = {}; try { json = JSON.parse(xhr.responseText || '{}'); } catch { json = {}; }
          if (xhr.status === 413) return reject(new Error('SAGUN_FILE_SIZE'));
          if (xhr.status < 200 || xhr.status >= 300) return reject(Object.assign(new Error(/too large/i.test(json.error || '') ? 'SAGUN_FILE_SIZE' : json.error || 'SAGUN_FILE'), { status: xhr.status }));
          onProgress(100); resolve(json);
        };
        xhr.send(body);
      });
    }
    const response = await apiFetch(`${apiBase}${API.sagun}/profiles/${encodeURIComponent(id)}/files/${encodeURIComponent(kind)}`, { method: 'POST', credentials: 'include', body });
    if (response.status === 413) throw new Error('SAGUN_FILE_SIZE');
    if (!response.ok) { const error = (await response.json().catch(() => ({}))).error || 'SAGUN_FILE'; throw new Error(/too large/i.test(error) ? 'SAGUN_FILE_SIZE' : error); }
    return response.json();
  },
  file: async id => {
    const response = await apiFetch(`${apiBase}${API.sagun}/files/${encodeURIComponent(id)}`, { credentials: 'include' });
    if (!response.ok) throw new Error('SAGUN_NOT_FOUND');
    return response.blob();
  },
  deleteFile: id => request(`${API.sagun}/files/${encodeURIComponent(id)}`, { method: 'DELETE' }),
} };
