// Every backend URL the frontend calls, in one place. Paths follow the
// backend's /api/v1 conventions (plural kebab-case resources, no verbs).
export const API_PREFIX = '/api/v1';

// Entity name (as used in `base44.entities.<Name>`) -> REST resource path.
export const ENTITY_RESOURCES = {
  Announcement: 'announcements',
  Application: 'applications',
  Event: 'events',
  EventRegistration: 'event-registrations',
  Family: 'families',
  FamilyMember: 'family-members',
  Feedback: 'feedback',
  Notification: 'notifications',
  Principle: 'principles',
  Rule: 'rules',
  Samiti: 'samitis',
  SamitiMember: 'samiti-members',
  Student: 'students',
  StudentApplication: 'student-applications',
  Transaction: 'transactions',
  TransferRequest: 'transfer-requests',
};

// Unknown entity names fall through to a path the backend answers with 404,
// so callers still get a rejected request rather than a synchronous throw.
const resource = (entity) => `${API_PREFIX}/${ENTITY_RESOURCES[entity] || encodeURIComponent(entity)}`;

export const API = {
  uploads: `${API_PREFIX}/uploads`,
  auth: {
    registrations: `${API_PREFIX}/auth/registrations`,
    otpVerifications: `${API_PREFIX}/auth/otp-verifications`,
    otps: `${API_PREFIX}/auth/otps`,
    sessions: `${API_PREFIX}/auth/sessions`,
    currentSession: `${API_PREFIX}/auth/sessions/current`,
    passwordResets: `${API_PREFIX}/auth/password-resets`,
    passwordResetConfirmations: `${API_PREFIX}/auth/password-resets/confirmations`,
    password: `${API_PREFIX}/auth/password`,
    me: `${API_PREFIX}/auth/me`,
    invitations: `${API_PREFIX}/auth/invitations`,
  },
  me: {
    family: `${API_PREFIX}/me/family`,
    feedback: `${API_PREFIX}/me/feedback`,
    eventRegistrations: `${API_PREFIX}/me/event-registrations`,
  },
  familyVerification: (familyId) => `${API_PREFIX}/family-verifications/${encodeURIComponent(familyId)}`,
  applicationStatus: (applicationId, mobile) =>
    `${API_PREFIX}/application-status?applicationId=${encodeURIComponent(applicationId)}&mobile=${encodeURIComponent(mobile)}`,
  mobileAvailability: (mobile) => `${API_PREFIX}/mobile-availability?mobile=${encodeURIComponent(mobile)}`,
  emailAvailability: (email) => `${API_PREFIX}/email-availability?email=${encodeURIComponent(email)}`,
  stats: `${API_PREFIX}/stats`,
  entities: {
    collection: (entity) => resource(entity),
    batch: (entity) => `${resource(entity)}/batch`,
    item: (entity, id) => `${resource(entity)}/${id}`,
    review: (entity, id) => `${resource(entity)}/${id}/review`,
  },
};
