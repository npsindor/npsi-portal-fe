// Student registration uses the same account flow as members (login / OTP account → registration form →
// UPI payment → admin approval), with registration type STUDENT and the ₹100 fee (FEES.STUDENT).
export const STUDENT_REGISTRATION_PATH = '/portal/registration?type=student';
export const studentLoginPath = () => `/login?portal=student&returnTo=${encodeURIComponent(STUDENT_REGISTRATION_PATH)}`;
export const isStudentReturn = (returnTo) => /[?&]type=student(?:&|$)/.test(String(returnTo || ''));

// Login portals. The server decides which one an account belongs to (from its registration records) and refuses the
// other; these are its exact messages, so the login page can offer to switch.
export const USE_FAMILY_LOGIN = 'Your account is registered as an NPS Family Member. Please use Family Member Login to access your account.';
export const USE_STUDENT_LOGIN = 'Your account is registered as an NPS Student. Please use Student Login to access your account.';
// Portal pages that only make sense for a family (a student account has none).
export const FAMILY_ONLY_PATHS = ['/portal/family', '/portal/event-kharcha'];
export const isFamilyOnlyPath = (path) => FAMILY_ONLY_PATHS.some((prefix) => String(path || '').split(/[?#]/)[0].startsWith(prefix));
