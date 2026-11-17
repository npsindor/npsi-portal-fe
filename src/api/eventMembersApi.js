import { API } from './endpoints';
import { API_BASE_URL } from './apiBaseUrl';
import { apiFetch } from '@/api/base44Client';

// Become an NPSI Event Member: the one application form, public team cards, and the admin workflow.
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
const json = (method, body) => ({ method, body: JSON.stringify(body ?? {}) });
const id = encodeURIComponent;
const A = () => API.eventMemberApplications;

export const eventMembersApi = {
  sections: () => call(API.eventMemberSections),
  // { section: 'CORE_TEAM' } or { event: '<slug>' } → { event, sections: [{ key, heading, members: [...] }] }
  teams: (query) => call(`${API.eventMembers}/teams?${new URLSearchParams(query)}`),
  apply: (body) => call(A(), json('POST', body)),
  candidates: () => call(`${A()}/candidates`),
  withdraw: (applicationId) => call(`${A()}/${id(applicationId)}/withdrawal`, json('POST')),
  admin: {
    list: () => call(A()),
    history: (applicationId) => call(`${A()}/${id(applicationId)}/history`),
    review: (applicationId, body) => call(`${A()}/${id(applicationId)}/review`, json('POST', body)),
    update: (applicationId, body) => call(`${A()}/${id(applicationId)}`, json('PATCH', body)),
    remove: (applicationId, reason) => call(`${A()}/${id(applicationId)}/removal`, json('POST', { reason })),
    people: (q) => call(`${A()}/people?${new URLSearchParams({ q })}`),
    sections: () => call(`${API.eventMemberSections}/admin`),
    createSection: (body) => call(API.eventMemberSections, json('POST', body)),
    updateSection: (sectionId, body) => call(`${API.eventMemberSections}/${id(sectionId)}`, json('PATCH', body)),
  },
};
