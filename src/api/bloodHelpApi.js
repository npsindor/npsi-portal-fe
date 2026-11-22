import { API } from './endpoints';
import { API_BASE_URL } from './apiBaseUrl';
import { apiFetch } from '@/api/base44Client';

// Blood Help Network (Community Services → Blood Donor) on this portal's own REST API.
const request = async (path, options = {}) => {
  const response = await apiFetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw Object.assign(new Error(body.error || `BLOOD_HTTP_${response.status}`), { status: response.status });
  }
  return response.status === 204 ? null : response.json();
};
const query = (values = {}) => {
  const text = new URLSearchParams(Object.entries(values).filter(([, value]) => value !== '' && value !== undefined && value !== null)).toString();
  return text ? `?${text}` : '';
};
const json = (method, body) => ({ method, body: JSON.stringify(body) });
const base = () => API.bloodHelp;
const id = (value) => encodeURIComponent(value);

export const bloodApi = {
  summary: () => request(`${base()}/summary`),
  profile: () => request(`${base()}/me/profile`),
  saveDonor: (body) => request(`${base()}/me/donor`, json('PUT', body)),
  requests: (filters) => request(`${base()}/requests${query(filters)}`),
  recent: (lang) => request(`${base()}/requests/recent${query({ lang })}`),
  createRequest: (body) => request(`${base()}/requests`, json('POST', body)),
  suggestions: (requestId, lang) => request(`${base()}/requests/${id(requestId)}/suggestions${query({ lang })}`),
  notifyDonors: (requestId, donorIds, lang) => request(`${base()}/requests/${id(requestId)}/donor-notifications`, json('POST', { donorIds, lang })),
  pendingConfirmations: () => request(`${base()}/me/confirmations`),
  confirm: (requestId, received) => request(`${base()}/requests/${id(requestId)}/confirmation`, json('POST', { received })),
  admin: {
    requests: (filters) => request(`${base()}/admin/requests${query(filters)}`),
    setStatus: (requestId, body) => request(`${base()}/admin/requests/${id(requestId)}/status`, json('PATCH', body)),
  },
};
