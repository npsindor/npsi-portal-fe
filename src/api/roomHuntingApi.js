import { API } from './endpoints';
import { API_BASE_URL } from './apiBaseUrl';
import { apiFetch } from '@/api/base44Client';

// Room Hunting talks to this portal's own REST API (listings, requirements, matches, enquiries).
const request = async (path, options = {}) => {
  const response = await apiFetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw Object.assign(new Error(body.error || `ROOM_HTTP_${response.status}`), { status: response.status });
  }
  return response.status === 204 ? null : response.json();
};
const query = (values = {}) => {
  const text = new URLSearchParams(Object.entries(values).filter(([, value]) => value !== '' && value !== undefined && value !== null)).toString();
  return text ? `?${text}` : '';
};
const json = (method, body) => ({ method, body: JSON.stringify(body) });
const base = () => API.roomHunting;
const id = (value) => encodeURIComponent(value);

export const roomApi = {
  options: () => request(`${base()}/options`),
  listings: (filters) => request(`${base()}/listings${query(filters)}`),
  requirements: (filters) => request(`${base()}/requirements${query(filters)}`),
  postRequirement: (body) => request(`${base()}/requirements`, json('POST', body)),
  closeRequirement: (requirementId) => request(`${base()}/requirements/${id(requirementId)}/closure`, { method: 'PATCH' }),
  mine: () => request(`${base()}/me`),
  addListing: (body) => request(`${base()}/listings`, json('POST', body)),
  updateListing: (listingId, body) => request(`${base()}/listings/${id(listingId)}`, json('PUT', body)),
  listingStatus: (listingId, status) => request(`${base()}/listings/${id(listingId)}/status`, json('PATCH', { status })),
  removeListing: (listingId) => request(`${base()}/listings/${id(listingId)}`, { method: 'DELETE' }),
  enquire: (listingId, body) => request(`${base()}/listings/${id(listingId)}/enquiries`, json('POST', body)),
  admin: {
    stats: () => request(`${base()}/admin/stats`),
    listings: (filters) => request(`${base()}/admin/listings${query(filters)}`),
    requirements: (filters) => request(`${base()}/admin/requirements${query(filters)}`),
    matches: () => request(`${base()}/admin/matches`),
    audit: (entityId) => request(`${base()}/admin/audit-logs${query({ entityId })}`),
    reviewListing: (listingId, decision, remarks) => request(`${base()}/admin/listings/${id(listingId)}/review`, json('PATCH', { decision, remarks })),
    reviewRequirement: (requirementId, decision, remarks) => request(`${base()}/admin/requirements/${id(requirementId)}/review`, json('PATCH', { decision, remarks })),
  },
};
