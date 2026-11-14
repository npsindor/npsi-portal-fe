// Student registration uses the same account flow as members (login / OTP account → registration form →
// UPI payment → admin approval), with registration type STUDENT and the ₹100 fee (FEES.STUDENT).
export const STUDENT_REGISTRATION_PATH = '/portal/registration?type=student';
export const studentLoginPath = () => `/login?returnTo=${encodeURIComponent(STUDENT_REGISTRATION_PATH)}`;
export const isStudentReturn = (returnTo) => /[?&]type=student(?:&|$)/.test(String(returnTo || ''));
