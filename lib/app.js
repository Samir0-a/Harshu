'use strict';
/**
 * Finance portfolio — Express app.
 * Serves the public site + admin panel and a small JSON API.
 *
 * Content is read/written through lib/storage.js and lib/photos.js rather
 * than directly through `fs`, so the exact same app works two ways:
 *   - locally, or on any normal Node host: JSON files on disk
 *   - on Vercel: Vercel KV (content) + Vercel Blob (photos)
 * See those two files for details.
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const storage = require('./storage');
const photos = require('./photos');

// Optional .env loader for local dev (no extra dependency). Vercel injects
// environment variables itself, so this simply finds nothing there and
// does nothing.
try {
  const envFile = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
  envFile.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  });
} catch (_) { /* no .env file — fine */ }

/* ---------- validation / sanitising ---------- */
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const safeUrl = (v) => {
  const s = str(v, 500);
  return /^(https?:\/\/|mailto:|tel:|\/(?!\/))/i.test(s) ? s : '';
};
const hex = (v, fallback) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback);

// type: s = text(max), u = url, n = number 0-100
const PROFILE_FIELDS = {
  name: ['s', 100], title: ['s', 150], tagline: ['s', 300], location: ['s', 100],
  email: ['s', 120], phone: ['s', 40], photo: ['u'], resumeUrl: ['u'],
  linkedin: ['u'], github: ['u'], twitter: ['u'], about: ['s', 4000],
};
const LISTS = {
  stats: { max: 6, f: { label: ['s', 60], value: ['s', 30] } },
  skills: { max: 60, f: { name: ['s', 80], category: ['s', 60], level: ['n'] } },
  education: { max: 20, f: { institution: ['s', 150], degree: ['s', 200], period: ['s', 60], description: ['s', 1500] } },
  experience: { max: 30, f: { role: ['s', 150], org: ['s', 150], period: ['s', 60], description: ['s', 1500] } },
  projects: { max: 30, f: { title: ['s', 150], description: ['s', 1500], tags: ['s', 200], link: ['u'] } },
  certifications: { max: 30, f: { name: ['s', 150], issuer: ['s', 120], year: ['s', 20], link: ['u'] } },
  insights: { max: 30, f: { title: ['s', 200], summary: ['s', 800], date: ['s', 40], link: ['u'] } },
};
const SECTIONS = ['about', 'skills', 'education', 'experience', 'projects', 'certifications', 'insights', 'contact'];

function cleanObject(src, defs) {
  const out = {};
  src = src && typeof src === 'object' ? src : {};
  for (const [key, [type, max]] of Object.entries(defs)) {
    if (type === 's') out[key] = str(src[key], max);
    else if (type === 'u') out[key] = safeUrl(src[key]);
    else if (type === 'n') out[key] = Math.max(0, Math.min(100, Math.round(Number(src[key]) || 0)));
  }
  return out;
}
function cleanList(arr, spec) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, spec.max).map((item) => {
    const clean = cleanObject(item, spec.f);
    clean.id = typeof item?.id === 'string' && /^[\w-]{6,60}$/.test(item.id) ? item.id : crypto.randomUUID();
    return clean;
  });
}
function cleanPortfolio(body) {
  body = body && typeof body === 'object' ? body : {};
  const out = {
    profile: cleanObject(body.profile, PROFILE_FIELDS),
    settings: {
      siteTitle: str(body.settings?.siteTitle, 100),
      footerText: str(body.settings?.footerText, 200),
      accent: hex(body.settings?.accent, '#c9a227'),
    },
    sections: {},
  };
  SECTIONS.forEach((s) => { out.sections[s] = body.sections?.[s] !== false; });
  Object.entries(LISTS).forEach(([key, spec]) => { out[key] = cleanList(body[key], spec); });
  return out;
}

/* ---------- admin account (created on first use) ---------- */
async function ensureAdmin() {
  const existing = await storage.getAdmin();
  if (existing) return existing;
  const initial = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const created = { passwordHash: bcrypt.hashSync(initial, 12) };
  await storage.saveAdmin(created);
  console.log('\n  Admin account created.');
  console.log('  Login at /admin with password: ' + initial);
  console.log('  Change it right away from Admin > Account.\n');
  return created;
}

// The JWT secret is fetched async (it may live in KV); cache it in memory
// for the life of this process so we don't re-fetch it on every request.
let cachedSecret = null;
async function getSecret() {
  if (!cachedSecret) cachedSecret = await storage.getJwtSecret();
  return cachedSecret;
}

/* ---------- app ---------- */
const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '200kb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Wraps an async route handler so a rejected promise reaches Express's
// error handler (below) instead of hanging the request.
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/* ---------- photo upload ---------- */
const PHOTO_MIME_EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!PHOTO_MIME_EXT[file.mimetype]) return cb(new Error('Please upload a JPG, PNG or WEBP image.'));
    cb(null, true);
  },
});
const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many uploads. Please try again shortly.' } });

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many login attempts. Try again in 15 minutes.' } });
const contactLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many messages sent. Please try again later.' } });

const requireAuth = (req, res, next) => {
  (async () => {
    const secret = await getSecret();
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    try { jwt.verify(token, secret); next(); }
    catch (_) { res.status(401).json({ error: 'Session expired. Please sign in again.' }); }
  })().catch(next); // a storage-config error here should surface as a clear 500, not a 401
};

/* ----- public API ----- */
app.get('/api/portfolio', ah(async (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.json(await storage.getPortfolio());
}));

app.post('/api/contact', contactLimiter, ah(async (req, res) => {
  const { name, email, message, website } = req.body || {};
  if (website) return res.json({ ok: true }); // honeypot: bots fill this in
  const clean = { name: str(name, 100), email: str(email, 150), message: str(message, 3000) };
  if (!clean.name || !clean.message) return res.status(400).json({ error: 'Please enter your name and a message.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  const messages = await storage.getMessages();
  messages.unshift({ id: crypto.randomUUID(), ...clean, date: new Date().toISOString(), read: false });
  await storage.saveMessages(messages.slice(0, 500));
  res.json({ ok: true });
}));

/* ----- admin API ----- */
app.post('/api/login', loginLimiter, ah(async (req, res) => {
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const admin = await ensureAdmin();
  const ok = admin.passwordHash && (await bcrypt.compare(password, admin.passwordHash));
  if (!ok) return res.status(401).json({ error: 'Incorrect password.' });
  const secret = await getSecret();
  res.json({ token: jwt.sign({ role: 'admin' }, secret, { expiresIn: '8h' }) });
}));

app.get('/api/admin/portfolio', requireAuth, ah(async (req, res) => res.json(await storage.getPortfolio())));

app.put('/api/admin/portfolio', requireAuth, ah(async (req, res) => {
  const clean = cleanPortfolio(req.body);

  // best-effort cleanup: if the photo changed away from a previously uploaded file, remove it
  const prev = (await storage.getPortfolio())?.profile?.photo;
  if (prev && prev !== clean.profile.photo) await photos.removePhoto(prev);

  await storage.savePortfolio(clean);
  res.json(clean);
}));

app.post('/api/admin/upload/photo', requireAuth, uploadLimiter, (req, res, next) => {
  upload.single('photo')(req, res, async (err) => {
    try {
      if (err) return res.status(400).json({ error: err.message || 'Upload failed.' });
      if (!req.file) return res.status(400).json({ error: 'No file received.' });
      const url = await photos.savePhoto(req.file.buffer, req.file.mimetype);

      // best-effort cleanup of the previous uploaded photo, if any
      const current = await storage.getPortfolio();
      const prevPhoto = current?.profile?.photo;
      if (prevPhoto && prevPhoto !== url) await photos.removePhoto(prevPhoto);

      res.json({ url });
    } catch (ex) { next(ex); }
  });
});

app.get('/api/admin/messages', requireAuth, ah(async (req, res) => res.json(await storage.getMessages())));

app.patch('/api/admin/messages/:id', requireAuth, ah(async (req, res) => {
  const messages = await storage.getMessages();
  const m = messages.find((x) => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: 'Message not found.' });
  m.read = req.body?.read !== false;
  await storage.saveMessages(messages);
  res.json(m);
}));

app.delete('/api/admin/messages/:id', requireAuth, ah(async (req, res) => {
  const messages = (await storage.getMessages()).filter((x) => x.id !== req.params.id);
  await storage.saveMessages(messages);
  res.json({ ok: true });
}));

app.post('/api/admin/password', requireAuth, loginLimiter, ah(async (req, res) => {
  const { current, next: newPass } = req.body || {};
  const admin = await ensureAdmin();
  if (!(await bcrypt.compare(String(current || ''), admin.passwordHash || ''))) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }
  if (typeof newPass !== 'string' || newPass.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }
  await storage.saveAdmin({ passwordHash: await bcrypt.hash(newPass, 12) });
  res.json({ ok: true });
}));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

/* ----- static files (unused on Vercel, where public/ is served directly) ----- */
app.use(express.static(path.join(__dirname, '..', 'public'), { extensions: ['html'] }));
app.get('/admin', (req, res) => res.redirect('/admin/'));

// Central error handler — must be registered last. Turns a thrown/rejected
// error (including the friendly "connect a database" errors above) into a
// clear JSON response instead of a hung request or a generic crash page.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Something went wrong on the server.' });
});

module.exports = app;
