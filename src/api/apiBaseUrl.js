// Production static builds must never ship a workstation's localhost API URL.
// Keep localhost for development, but use the currently deployed NPS API when
// a local .env value is accidentally carried into a production build.
const configured = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '');
const pointsToLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configured || '');

export const API_BASE_URL = import.meta.env.PROD && (!configured || pointsToLocalhost)
  ? 'https://api.npsindore.org'
  : configured || 'http://localhost:4000';
