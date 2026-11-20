// Auto-suggest for search boxes: the values already loaded on the page (names, IDs, villages, titles…) that contain
// what is being typed, those that start with it first, without repeats. `fields` are property names or functions of a
// row; arrays (e.g. tags) are searched value by value. Nothing is sent anywhere: the page's own data is used.
const norm = (value) => String(value ?? '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();

export function suggestValues(items, fields, query, limit = 8) {
  const q = norm(query);
  if (!q || !Array.isArray(items)) return [];
  const starts = [];
  const contains = [];
  const seen = new Set();
  for (const item of items) {
    for (const field of fields) {
      const raw = typeof field === 'function' ? field(item) : item?.[field];
      for (const value of Array.isArray(raw) ? raw : [raw]) {
        if (value === null || value === undefined || typeof value === 'object') continue;
        const text = String(value).replace(/\s+/g, ' ').trim();
        const key = norm(text);
        if (!key || key === q || seen.has(key) || !key.includes(q)) continue;
        seen.add(key);
        (key.startsWith(q) || key.split(' ').some((word) => word.startsWith(q)) ? starts : contains).push(text);
      }
    }
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}
