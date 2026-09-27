import { base44 } from "@/api/base44Client";

// Find an existing person across Student and FamilyMember by mobile or email.
// Used to prevent duplicate person records at the point of creation or transfer.
// excludeMemberId: skip a specific FamilyMember id (e.g. when editing the same member).
export async function findExistingPerson({ mobile, email, excludeMemberId = null }) {
  const m = (mobile || "").trim();
  const e = (email || "").trim().toLowerCase();
  if (!m && !e) return { found: false };

  const [students, members] = await Promise.all([
    base44.entities.Student.list(),
    base44.entities.FamilyMember.list(),
  ]);

  const matchStudent = students.find(
    (s) => (m && s.mobile === m) || (e && s.email && s.email.toLowerCase() === e)
  );
  if (matchStudent) return { found: true, type: "student", record: matchStudent };

  const matchMember = members.find(
    (mem) =>
      mem.id !== excludeMemberId &&
      ((m && mem.mobile === m) || (e && mem.email && mem.email.toLowerCase() === e))
  );
  if (matchMember) return { found: true, type: "member", record: matchMember };

  return { found: false };
}