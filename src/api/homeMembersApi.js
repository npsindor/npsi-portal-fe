import { API } from './endpoints';
import { API_BASE_URL } from './apiBaseUrl';
import { apiFetch } from '@/api/base44Client';
import { titleCase } from '@/lib/text-case';

// Public home page lists: the family heads an admin chose to show, and today's birthdays among their families.
const get = async (path) => {
  const response = await apiFetch(`${API_BASE_URL}${path}`, { credentials: 'include' });
  if (!response.ok) throw Object.assign(new Error(`HOME_HTTP_${response.status}`), { status: response.status });
  return response.json();
};

// Names and villages typed in any case ("deepa patidar", "HIMANSHU") are shown the same way: "Deepa Patidar".
const tidyPeople = (rows) =>
  Array.isArray(rows) ? rows.map((row) => ({ ...row, name: titleCase(row.name), place: row.place ? titleCase(row.place) : row.place })) : rows;

export const homeMembersApi = {
  familyHeads: () => get(`${API.homeMembers}/family-heads`).then(tidyPeople),
  birthdays: () => get(`${API.homeMembers}/birthdays`).then(tidyPeople),
};
