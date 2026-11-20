// Upload URLs are stored as the full URL the API answered with when the file was uploaded. A record created on a
// workstation (http://localhost:4000/uploads/x.jpg) or saved as a bare path (/uploads/x.jpg) would show a broken
// image anywhere else, so API answers are rewritten to this site's API address. Other hosts are left as they are.
const LOCAL_UPLOAD = /^(?:https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?)?\/(?:api\/v1\/)?uploads\/([A-Za-z0-9._-]+)$/i;

export const rehostUploadUrl = (value, apiBase) => {
  const match = LOCAL_UPLOAD.exec(value);
  return match ? `${apiBase}/uploads/${match[1]}` : value;
};

// Walks a parsed JSON body; only strings that are local upload URLs change.
export const rehostUploads = (value, apiBase) => {
  if (typeof value === 'string') return value.includes('/uploads/') ? rehostUploadUrl(value, apiBase) : value;
  if (Array.isArray(value)) return value.map((item) => rehostUploads(item, apiBase));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value)) out[key] = rehostUploads(item, apiBase);
    return out;
  }
  return value;
};
