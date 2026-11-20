import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rehostUploads, rehostUploadUrl } from './uploadUrls.js';

const API = 'https://api.npsindore.org';

test('local and bare upload URLs point at this site’s API; other hosts and text stay as they are', () => {
  assert.equal(rehostUploadUrl('http://localhost:4000/uploads/a1.jpg', API), `${API}/uploads/a1.jpg`);
  assert.equal(rehostUploadUrl('http://127.0.0.1:4001/uploads/b-2.png', API), `${API}/uploads/b-2.png`);
  assert.equal(rehostUploadUrl('/uploads/c.webp', API), `${API}/uploads/c.webp`);
  assert.equal(rehostUploadUrl('https://api-test.npsindore.org/uploads/d.jpg', API), 'https://api-test.npsindore.org/uploads/d.jpg');
  assert.equal(rehostUploadUrl('http://evil.example/uploads/e.jpg', API), 'http://evil.example/uploads/e.jpg');
  assert.equal(rehostUploadUrl('see /uploads/f.jpg here', API), 'see /uploads/f.jpg here');
  assert.equal(rehostUploadUrl('http://localhost:4000/uploads/../x', API), 'http://localhost:4000/uploads/../x');
});

test('nested API answers are rewritten without touching other values', () => {
  const body = { items: [{ bannerUrl: 'http://localhost:4000/uploads/a.jpg', photos: ['/uploads/b.jpg'], rent: 9000, ok: true, note: null }] };
  assert.deepEqual(rehostUploads(body, API), { items: [{ bannerUrl: `${API}/uploads/a.jpg`, photos: [`${API}/uploads/b.jpg`], rent: 9000, ok: true, note: null }] });
});
