import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { appStartPath, backAction, skipLabel } from './native-app.js';

// The mobile app: where it opens, what the Android back button does, and the live site it shows (so the app and the
// website are always the same version).
test('the app opens on the member portal; other paths are kept', () => {
  assert.equal(appStartPath('/'), '/portal');
  assert.equal(appStartPath(''), '/portal');
  assert.equal(appStartPath('/portal/registration'), null);
});

test('Android back goes back through pages and closes the app on the first one', () => {
  assert.equal(backAction(true), 'back');
  assert.equal(backAction(false), 'exit');
});

test('the app shows the live website (always the same as npsindore.org) with an offline page', () => {
  const config = JSON.parse(readFileSync(new URL('../../capacitor.config.json', import.meta.url), 'utf8'));
  assert.deepEqual([config.server.url, config.server.errorPath, config.webDir, config.appId], ['https://npsindore.org', 'offline.html', 'app-shell', 'org.npsindore.app']);
  assert.equal(config.server.cleartext, undefined, 'https only');
  assert.match(readFileSync(new URL('../../app-shell/offline.html', import.meta.url), 'utf8'), /https:\/\/npsindore\.org\//);
});

test('the opening video\'s Skip button follows the chosen language', () => {
  assert.equal(skipLabel('hi'), 'आगे बढ़ें');
  assert.equal(skipLabel('en'), 'Skip');
  assert.equal(skipLabel(null), 'Skip');
});
