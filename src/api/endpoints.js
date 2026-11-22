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
  sagun: `${API_PREFIX}/sagun`,
  sagunCards: `${API_PREFIX}/sagun-cards`,
  sagunBooklets: `${API_PREFIX}/sagun-booklets`,
  // Become an NPSI Event Member: team sections, public team cards, applications.
  eventMemberSections: `${API_PREFIX}/event-member-sections`,
  eventMembers: `${API_PREFIX}/event-members`,
  eventMemberApplications: `${API_PREFIX}/event-member-applications`,
  publicFeedback: `${API_PREFIX}/feedback/public`,
  eventFinance: `${API_PREFIX}/event-finance`,
  sehat: `${API_PREFIX}/sehat-saathi`,
  safar: `${API_PREFIX}/safar-saathi`,
  roomHunting: `${API_PREFIX}/room-hunting`,
  // Community Services → Blood Help Network: donors, blood requests, follow-up, admin verification.
  bloodHelp: `${API_PREFIX}/blood-help`,
  // Home page: family heads carousel and today's birthdays (admin-chosen families only).
  homeMembers: `${API_PREFIX}/home-members`,
  search: `${API_PREFIX}/search`,
  contactInfo: `${API_PREFIX}/contact-info`,
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
    mobileOtps: `${API_PREFIX}/auth/mobile-otps`,
    mobileOtpVerifications: `${API_PREFIX}/auth/mobile-otps/verifications`,
    mobileRegistrations: `${API_PREFIX}/auth/mobile-registrations`,
  },
  me: {
    family: `${API_PREFIX}/me/family`,
    feedback: `${API_PREFIX}/me/feedback`,
    eventRegistrations: `${API_PREFIX}/me/event-registrations`,
    transferRequests: `${API_PREFIX}/me/transfer-requests`,
    registrations: `${API_PREFIX}/me/registrations`,
    registration: (id) => `${API_PREFIX}/me/registrations/${encodeURIComponent(id)}`,
    paymentScreenshots: `${API_PREFIX}/me/payment-screenshots`,
    profileCompletion: `${API_PREFIX}/me/profile-completion`,
  },
  registrationPayments: `${API_PREFIX}/registration-payments`,
  registrationPaymentReview: (id) => `${API_PREFIX}/registration-payments/${encodeURIComponent(id)}/review`,
  registrationPaymentScreenshot: (id) => `${API_PREFIX}/registration-payments/${encodeURIComponent(id)}/screenshot`,
  // Admin dashboard charts (monthly transactions, users, registrations).
  adminDashboardCharts: `${API_PREFIX}/admin-dashboard/charts`,
  // Role-based admin access (Admin → Assign roles): list, candidates, PUT / DELETE /:userId.
  adminAccess: `${API_PREFIX}/admin-access`,
  // Pages / homepage sections switched off by an admin (GET: public; PUT: admin).
  siteVisibility: `${API_PREFIX}/site-visibility`,
  addressOptions: `${API_PREFIX}/address-options`,
  addressOptionsAll: `${API_PREFIX}/address-options/all`,
  addressOption: (id) => `${API_PREFIX}/address-options/${encodeURIComponent(id)}`,
  homeHighlights: `${API_PREFIX}/home-highlights`,
  homeHighlight: (id) => `${API_PREFIX}/home-highlights/${encodeURIComponent(id)}`,
  communityPosts: `${API_PREFIX}/community-posts`,
  communityPost: (id) => `${API_PREFIX}/community-posts/${encodeURIComponent(id)}`,
  pageBlocks: `${API_PREFIX}/page-blocks`,
  pageBlock: (id) => `${API_PREFIX}/page-blocks/${encodeURIComponent(id)}`,
  seniorDisciplineCommittee: `${API_PREFIX}/senior-discipline-committee`,
  seniorDisciplineCommitteeAll: `${API_PREFIX}/senior-discipline-committee/all`,
  seniorDisciplineCommitteeMember: (id) => `${API_PREFIX}/senior-discipline-committee/${encodeURIComponent(id)}`,
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
