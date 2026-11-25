import assert from 'node:assert/strict';
import { test } from 'node:test';
import { titleCase } from './text-case.js';

test('names and villages are shown in title case, whatever case they were typed in', () => {
  assert.equal(titleCase('deepa patidar'), 'Deepa Patidar');
  assert.equal(titleCase('HIMANSHU SITARAM PATIDAR'), 'Himanshu Sitaram Patidar');
  assert.equal(titleCase('Pravin PATIDAR'), 'Pravin Patidar');
  assert.equal(titleCase('  dr.  lakhan   patidar '), 'Dr. Lakhan Patidar');
  assert.equal(titleCase('nandgaon-bagud'), 'Nandgaon-Bagud');
  assert.equal(titleCase('GHEGAON'), 'Ghegaon');
});

test('empty values and other scripts are safe', () => {
  assert.equal(titleCase(null), '');
  assert.equal(titleCase(undefined), '');
  assert.equal(titleCase(''), '');
  assert.equal(titleCase('महेश पाटीदार'), 'महेश पाटीदार');
});
