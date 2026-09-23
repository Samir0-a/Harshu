'use strict';
/**
 * Photo storage abstraction, mirroring lib/storage.js:
 *
 *  - Any normal Node host: uploaded photos are written to public/uploads/
 *    and served as static files, exactly as before.
 *
 *  - Vercel: the filesystem isn't writable or persistent, so when a
 *    Vercel Blob store is connected (Storage tab in the Vercel dashboard
 *    \u2192 the BLOB_READ_WRITE_TOKEN env var it creates), photos are
 *    uploaded there instead and referenced by their public Blob URL.
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const ON_VERCEL = !!process.env.VERCEL;
const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

let blob = null;
if (USE_BLOB) blob = require('@vercel/blob');

const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');
if (!USE_BLOB) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const EXT_BY_MIME = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

function assertConfigured() {
  if (ON_VERCEL && !USE_BLOB) {
    const err = new Error(
      'No photo storage connected yet. In your Vercel project, go to Storage \u2192 connect a Blob store (Storage \u2192 Create Database \u2192 Blob), then redeploy.'
    );
    err.code = 'STORAGE_NOT_CONFIGURED';
    throw err;
  }
}

async function savePhoto(buffer, mimetype) {
  assertConfigured();
  const ext = EXT_BY_MIME[mimetype];
  const filename = 'photo-' + crypto.randomBytes(8).toString('hex') + ext;
  if (USE_BLOB) {
    const result = await blob.put(filename, buffer, {
      access: 'public',
      contentType: mimetype,
      addRandomSuffix: true,
    });
    return result.url; // full https:// URL, safe to store directly
  }
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
  return '/uploads/' + filename;
}

async function removePhoto(url) {
  // Best-effort cleanup — never let a failed delete break the request.
  if (!url) return;
  try {
    if (USE_BLOB && /^https?:\/\//i.test(url)) {
      await blob.del(url);
      return;
    }
    if (!USE_BLOB && url.startsWith('/uploads/')) {
      fs.unlink(path.join(UPLOADS_DIR, path.basename(url)), () => {});
    }
  } catch (_) { /* ignore — the old file/blob just gets orphaned */ }
}

module.exports = { ON_VERCEL, USE_BLOB, savePhoto, removePhoto };
