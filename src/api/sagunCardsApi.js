import { API } from './endpoints';
import { API_BASE_URL } from './apiBaseUrl';
import { apiFetch } from '@/api/base44Client';

// Sagun Digital Cards & booklet (admin) and the public QR verification. PDFs come back as Blobs.
const call = async (path, options = {}, as = 'json') => {
  const response = await apiFetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw Object.assign(new Error(body.error || `Request failed: ${response.status}`), { status: response.status });
  }
  if (as === 'blob') return { blob: await response.blob(), pages: Number(response.headers.get('X-Total-Pages')) || null };
  return response.status === 204 ? null : response.json();
};
const query = (values) => new URLSearchParams(Object.entries(values).filter(([, value]) => value !== '' && value !== undefined && value !== null));
const post = (body) => ({ method: 'POST', body: JSON.stringify(body) });

export const sagunCardsApi = {
  stats: () => call(`${API.sagunCards}/stats`),
  list: (filters = {}) => call(`${API.sagunCards}?${query(filters)}`),
  select: (profileIds, selected) => call(`${API.sagunCards}/selection`, { method: 'PATCH', body: JSON.stringify({ profileIds, selected }) }),
  cardPdf: (profileId) => call(`${API.sagunCards}/${encodeURIComponent(profileId)}/pdf`, {}, 'blob'),
  verify: (token) => call(`${API.sagunCards}/verifications/${encodeURIComponent(token)}`),
  bookletPlan: (options) => call(`${API.sagunBooklets}/plans`, post(options)),
  bookletPreview: (options) => call(`${API.sagunBooklets}/previews`, post(options), 'blob'),
  generateBooklet: (options) => call(API.sagunBooklets, post(options)),
  history: () => call(API.sagunBooklets),
  historyPdf: (id) => call(`${API.sagunBooklets}/${encodeURIComponent(id)}/pdf`, {}, 'blob'),
};

export const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
};

// Opens the PDF in a new tab for the browser's own print dialog (exact PDF, no re-rendering).
export const printBlob = (blob) => {
  const url = URL.createObjectURL(blob);
  const tab = window.open(url, '_blank');
  if (tab) tab.opener = null;
  else saveBlob(blob, 'sagun-print.pdf');
  setTimeout(() => URL.revokeObjectURL(url), 120000);
};
