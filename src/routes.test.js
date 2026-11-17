// Every top-level route of the app must be served the app by the web server (public/.htaccess);
// a route missing there would answer with HTTP 404 even though the page works.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';

const read = (file) => fs.readFileSync(new URL(file, import.meta.url), 'utf8');

test('public/.htaccess lists every top-level route in App.jsx', () => {
  const app = read('./App.jsx');
  const segments = new Set([...app.matchAll(/path="\/([^/"*:]+)/g)].map((match) => match[1]));
  const rule = /RewriteRule \^\(([^)]+)\)\(\/\.\*\)\?\$ \/index\.html/.exec(read('../public/.htaccess'));
  assert.ok(rule, 'route rewrite rule not found in public/.htaccess');
  const served = new Set(rule[1].split('|'));
  const missing = [...segments].filter((segment) => !served.has(segment));
  assert.deepEqual(missing, [], `add these to the RewriteRule in public/.htaccess: ${missing.join(', ')}`);
});
