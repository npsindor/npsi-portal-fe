// Names and places as people type them ("deepa patidar", "HIMANSHU SITARAM", "ghegaon") shown the same way everywhere:
// each word starts with a capital, the rest lower case ("Deepa Patidar", "Himanshu Sitaram", "Ghegaon"). A letter after
// a hyphen, dot, apostrophe or bracket starts a word too ("Dr. Lakhan", "Nandgaon-Bagud"). Extra spaces are dropped.
// Hindi and other scripts without capitals stay as they are. Display only: the stored value is never changed.
export const titleCase = (value) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/(^|[\s\-.'’(/])(\p{Ll})/gu, (_, before, letter) => before + letter.toUpperCase());
