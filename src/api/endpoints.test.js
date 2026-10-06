// Run with `npm test` (Node's built-in test runner). Checks every frontend
// API URL against the backend's /api/v1 path mapping (docs/migration-plan.md
// in the backend repo) and that no hard-coded API path bypasses this module.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { API, API_PREFIX, ENTITY_RESOURCES } from './endpoints.js';

describe('API endpoints', () => {
  test('auth, me, uploads and lookups match the backend mapping', () => {
    assert.equal(API_PREFIX, '/api/v1');
    assert.deepEqual(API.auth, {
      registrations: '/api/v1/auth/registrations',
      otpVerifications: '/api/v1/auth/otp-verifications',
      otps: '/api/v1/auth/otps',
      sessions: '/api/v1/auth/sessions',
      currentSession: '/api/v1/auth/sessions/current',
      passwordResets: '/api/v1/auth/password-resets',
      passwordResetConfirmations: '/api/v1/auth/password-resets/confirmations',
      password: '/api/v1/auth/password',
      me: '/api/v1/auth/me',
      invitations: '/api/v1/auth/invitations',
    });
    assert.deepEqual(API.me, { family: '/api/v1/me/family', feedback: '/api/v1/me/feedback', eventRegistrations: '/api/v1/me/event-registrations' });
    assert.equal(API.uploads, '/api/v1/uploads');
    assert.equal(API.stats, '/api/v1/stats');
  });

  test('lookups encode their parameters', () => {
    assert.equal(API.familyVerification('NPSI-FAM-000001'), '/api/v1/family-verifications/NPSI-FAM-000001');
    assert.equal(API.familyVerification('a/b'), '/api/v1/family-verifications/a%2Fb');
    assert.equal(API.applicationStatus('NPSI-APP-2026-000001', '+91 98765'), '/api/v1/application-status?applicationId=NPSI-APP-2026-000001&mobile=%2B91%2098765');
    assert.equal(API.mobileAvailability('98765 43210'), '/api/v1/mobile-availability?mobile=98765%2043210');
    assert.equal(API.emailAvailability('a+b@x.com'), '/api/v1/email-availability?email=a%2Bb%40x.com');
  });

  test('every entity maps to its plural kebab-case resource', () => {
    assert.deepEqual(ENTITY_RESOURCES, {
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
    });
    assert.equal(API.entities.collection('FamilyMember'), '/api/v1/family-members');
    assert.equal(API.entities.batch('Family'), '/api/v1/families/batch');
    assert.equal(API.entities.item('EventRegistration', 'abc'), '/api/v1/event-registrations/abc');
  });

  test('unknown entities still produce a URL (the backend answers 404)', () => {
    assert.equal(API.entities.collection('Mystery'), '/api/v1/Mystery');
  });
});

describe('API usage', () => {
  const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const files = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? files(full) : /\.(jsx?|tsx?)$/.test(entry.name) ? [full] : [];
  });

  test('every entity the app uses has a resource mapping', () => {
    const used = new Set(files(srcDir).flatMap((file) => [...fs.readFileSync(file, 'utf8').matchAll(/entities\.([A-Z][A-Za-z]+)/g)].map((m) => m[1])));
    for (const name of used) assert.ok(ENTITY_RESOURCES[name], `no resource mapping for entity ${name}`);
  });

  test('no backend path is hard-coded outside endpoints.js', () => {
    const allowed = new Set(['api/endpoints.js', 'api/endpoints.test.js']);
    const offenders = files(srcDir)
      .filter((file) => !allowed.has(path.relative(srcDir, file)))
      .filter((file) => /['"`]\/api\//.test(fs.readFileSync(file, 'utf8')));
    assert.deepEqual(offenders, []);
  });
});
