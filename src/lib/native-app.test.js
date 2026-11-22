import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { appStartPath, backAction, skipLabel } from './native-app.js';

// The mobile app: where it opens, what the Android back button does, and the origin it is served from (the API's
// CORS list allows exactly https://app.npsindore.org, so the website's session cookie works inside the app).
test('the app opens on the member portal; other paths are kept', () => {
  assert.equal(appStartPath('/'), '/portal');
  assert.equal(appStartPath(''), '/portal');
  assert.equal(appStartPath('/portal/registration'), null);
});

test('Android back goes back through pages and closes the app on the first one', () => {
  assert.equal(backAction(true), 'back');
  assert.equal(backAction(false), 'exit');
});

test('the app is served from https://app.npsindore.org and builds into dist-app', () => {
  const config = JSON.parse(readFileSync(new URL('../../capacitor.config.json', import.meta.url), 'utf8'));
  assert.deepEqual([config.server.hostname, config.server.androidScheme, config.webDir, config.appId], ['app.npsindore.org', 'https', 'dist-app', 'org.npsindore.app']);
});

test('the opening video\'s Skip button follows the chosen language', () => {
  assert.equal(skipLabel('hi'), 'आगे बढ़ें');
  assert.equal(skipLabel('en'), 'Skip');
  assert.equal(skipLabel(null), 'Skip');
});
