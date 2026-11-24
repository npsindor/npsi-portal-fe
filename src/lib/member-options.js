// Dropdown lists for member details. The saved value is the English label (what the database already holds for
// members typed in before these lists existed); Hindi is only for display.
import { indiaToday } from "@/lib/dates";

const ordinal = (n) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;

export const EDUCATION_LEVELS = [
  { value: "LKG", en: "LKG", hi: "एलकेजी" },
  { value: "UKG", en: "UKG", hi: "यूकेजी" },
  ...Array.from({ length: 12 }, (_, i) => ({ value: ordinal(i + 1), en: ordinal(i + 1), hi: `कक्षा ${i + 1}` })),
  { value: "Graduate (Pursuing)", en: "Graduate (Pursuing)", hi: "स्नातक (अध्ययनरत)" },
  { value: "Graduate", en: "Graduate", hi: "स्नातक" },
  { value: "Post Graduate (Pursuing)", en: "Post Graduate (Pursuing)", hi: "स्नातकोत्तर (अध्ययनरत)" },
  { value: "Post Graduate", en: "Post Graduate", hi: "स्नातकोत्तर" },
];

export const OCCUPATIONS = [
  { value: "Business", en: "Business", hi: "व्यापार" },
  { value: "Government Job", en: "Government Job", hi: "सरकारी नौकरी" },
  { value: "Private Job", en: "Private Job", hi: "प्राइवेट नौकरी" },
  { value: "Retired", en: "Retired", hi: "सेवानिवृत्त" },
  { value: "Student", en: "Student", hi: "विद्यार्थी" },
  { value: "Shopkeeper", en: "Shopkeeper", hi: "दुकानदार" },
  { value: "Doctor", en: "Doctor", hi: "डॉक्टर" },
  { value: "Housewife", en: "Housewife", hi: "गृहिणी" },
];

export const MARITAL_STATUSES = [
  { value: "MARRIED", en: "Married", hi: "विवाहित" },
  { value: "UNMARRIED", en: "Unmarried", hi: "अविवाहित" },
];

const course = (en, hi = en) => ({ value: en, en, hi });
// Courses after 12th a student can pick in the registration form (they can also type one that isn't listed).
// Student registration is for 18+ only, so school classes (LKG–12th) are not offered.
export const STUDENT_COURSES = [
  ...EDUCATION_LEVELS.filter((level) => level.value.includes("Graduate")),
  course("ITI"),
  course("Diploma / Polytechnic", "डिप्लोमा / पॉलिटेक्निक"),
  course("B.A."),
  course("B.Sc."),
  course("B.Sc. (Agriculture)", "बी.एससी. (कृषि)"),
  course("B.Sc. Nursing", "बी.एससी. नर्सिंग"),
  course("B.Com."),
  course("BBA"),
  course("BCA"),
  course("B.Tech / B.E. (Computer Science)"),
  course("B.Tech / B.E. (Information Technology)"),
  course("B.Tech / B.E. (Mechanical)"),
  course("B.Tech / B.E. (Civil)"),
  course("B.Tech / B.E. (Electrical)"),
  course("B.Tech / B.E. (Electronics)"),
  course("B.Arch"),
  course("B.Pharm"),
  course("D.Pharm"),
  course("MBBS"),
  course("BDS"),
  course("BAMS"),
  course("BHMS"),
  course("BPT (Physiotherapy)"),
  course("B.V.Sc. (Veterinary)"),
  course("LLB"),
  course("BA LLB"),
  course("B.Ed."),
  course("D.El.Ed."),
  course("BHM (Hotel Management)"),
  course("B.Des. (Design)"),
  course("CA"),
  course("CS (Company Secretary)"),
  course("CMA"),
  course("M.A."),
  course("M.Sc."),
  course("M.Com."),
  course("MBA"),
  course("MCA"),
  course("M.Tech / M.E."),
  course("M.Pharm"),
  course("MD / MS"),
  course("LLM"),
  course("M.Ed."),
  course("Ph.D."),
  course("Competitive exam preparation", "प्रतियोगी परीक्षा की तैयारी"),
];

// A school class (LKG, UKG, 1st–12th, "class 10", nursery): not a course for student registration (after 12th only).
export const isSchoolClass = (value) => /^\s*(nursery|lkg|ukg|(class\s*)?\d{1,2}\s*(st|nd|rd|th)?(\b|\s|$)|class\s*\d)/i.test(String(value || ""));

// Label in the page language; a saved value that isn't in the list is shown as it is.
export const optionLabel = (options, value, lang) => {
  const option = options.find((o) => o.value === value);
  return option ? (lang === "hi" ? option.hi : option.en) : value || "";
};

// The list plus a saved value that isn't in it (typed before the list existed), so editing never loses it.
export const withCurrent = (options, value) => (value && !options.some((o) => o.value === value) ? [...options, { value, en: value, hi: value }] : options);

// Whole years between a YYYY-MM-DD birth date and today (India time); null without a date.
export const ageFrom = (dob, today = indiaToday()) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dob || ""));
  if (!match) return null;
  const [y, m, d] = today.split("-").map(Number);
  const age = y - Number(match[1]) - (m < Number(match[2]) || (m === Number(match[2]) && d < Number(match[3])) ? 1 : 0);
  return age >= 0 ? age : null;
};

// Marital status is asked for a son or daughter only once the birth date shows them 18 or older (no birth date: not
// asked); for every other relationship it is always asked.
export const CHILD_RELATIONSHIPS = ["Son", "Daughter"];
export const asksMaritalStatus = (relationship, dob, today = indiaToday()) =>
  !CHILD_RELATIONSHIPS.includes(relationship) || (ageFrom(dob, today) ?? 0) >= 18;

// The "waiting for approval: no events or Shagun Bandhan yet" note matters only to an unmarried adult
// (Shagun Bandhan is for them); it isn't shown on other members' cards.
export const showsApprovalNote = (member, today = indiaToday()) =>
  member?.status === "PENDING" && member?.maritalStatus === "UNMARRIED" && (ageFrom(member?.dob, today) ?? 0) >= 18;
