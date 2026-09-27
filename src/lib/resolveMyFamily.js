import { base44 } from "@/api/base44Client";

// Resolve the logged-in user's family, its members, and student profile.
// Computed server-side (matched by the user's own email) so a member's
// browser never has to fetch every other family's data just to find its own.
// Returns { family, members, student } — null/[] when nothing matches.
export async function resolveMyFamily(user) {
  if (!user) return { family: null, members: [], student: null };
  try {
    return await base44.me.family();
  } catch (e) {
    return { family: null, members: [], student: null };
  }
}