import { API } from './endpoints';
import { API_BASE_URL } from './apiBaseUrl';
import { apiFetch } from '@/api/base44Client';

// Public home page lists: the family heads an admin chose to show, and today's birthdays among their families.
const get = async (path) => {
  const response = await apiFetch(`${API_BASE_URL}${path}`, { credentials: 'include' });
  if (!response.ok) throw Object.assign(new Error(`HOME_HTTP_${response.status}`), { status: response.status });
  return response.json();
};

export const homeMembersApi = {
  familyHeads: () => get(`${API.homeMembers}/family-heads`),
  birthdays: () => get(`${API.homeMembers}/birthdays`),
};
