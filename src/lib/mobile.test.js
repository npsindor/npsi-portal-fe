import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isValidMobile, normalizeField, sanitizeMobile } from './mobile.js';

// Every form keeps a mobile number as exactly 10 digits starting with 6-9.
test('typed or pasted numbers become the 10-digit mobile', () => {
  for (const [input, expected] of [
    ['+91 98765 43210', '9876543210'],
    ['91-9876543210', '9876543210'],
    ['919876543210', '9876543210'],
    ['09876543210', '9876543210'],
    ['98260 12345', '9826012345'],
    ['9123456789', '9123456789'],
    ['98765432109999', '9876543210'],
    ['12345', ''],
    ['', ''],
    [null, ''],
  ]) assert.equal(sanitizeMobile(input), expected, String(input));
});

test('only 10 digits starting with 6-9 are valid', () => {
  assert.equal(isValidMobile('9876543210'), true);
  assert.equal(isValidMobile('987654321'), false);
  assert.equal(isValidMobile('5876543210'), false);
  assert.equal(isValidMobile('+919876543210'), false);
});

test('form setters clean mobile keys only', () => {
  assert.equal(normalizeField('guardianMobile', '+91 98765 43210'), '9876543210');
  assert.equal(normalizeField('contactNumber', '098765-43210'), '9876543210');
  assert.equal(normalizeField('whatsapp', '98765 43210'), '9876543210');
  assert.equal(normalizeField('showMobile', true), true);
  assert.equal(normalizeField('name', 'Ram 91'), 'Ram 91');
});
