'use strict';
/**
 * Finance portfolio — Express server.
 * Serves the public site + admin panel and a small JSON API.
 * Content lives in data/portfolio.json (atomic writes, no database needed).
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const multer = require('multer');

// Optional .env loader (no extra dependency)
try {
  const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  envFile.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  });
} catch (_) { /* no .env file — fine */ }

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const F_PORTFOLIO = path.join(DATA_DIR, 'portfolio.json');
const F_ADMIN = path.join(DATA_DIR, 'admin.json');
const F_SECRET = path.join(DATA_DIR, 'secret.json');
const F_MESSAGES = path.join(DATA_DIR, 'messages.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

/* ---------- small file helpers ---------- */
const readJSON = (file, fallback) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return fallback; }
};
const writeJSON = (file, data) => {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file); // atomic replace
};

/* ---------- secrets & admin account ---------- */
fs.mkdirSync(DATA_DIR, { recursive: true });

let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  const saved = readJSON(F_SECRET, null);
  if (saved && saved.secret) JWT_SECRET = saved.secret;
  else {
    JWT_SECRET = crypto.randomBytes(48).toString('hex');
    writeJSON(F_SECRET, { secret: JWT_SECRET });
  }
}

if (!fs.existsSync(F_ADMIN)) {
  const initial = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  writeJSON(F_ADMIN, { passwordHash: bcrypt.hashSync(initial, 12) });
  console.log('\n  Admin account created.');
  console.log('  Login at /admin with password: ' + initial);
  console.log('  Change it right away from Admin > Settings.\n');
}
if (!fs.existsSync(F_MESSAGES)) writeJSON(F_MESSAGES, []);

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
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  try { jwt.verify(token, JWT_SECRET); next(); }
  catch (_) { res.status(401).json({ error: 'Session expired. Please sign in again.' }); }
};

/* ----- public API ----- */
app.get('/api/portfolio', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.json(readJSON(F_PORTFOLIO, {}));
});

app.post('/api/contact', contactLimiter, (req, res) => {
  const { name, email, message, website } = req.body || {};
  if (website) return res.json({ ok: true }); // honeypot: bots fill this in
  const clean = { name: str(name, 100), email: str(email, 150), message: str(message, 3000) };
  if (!clean.name || !clean.message) return res.status(400).json({ error: 'Please enter your name and a message.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  const messages = readJSON(F_MESSAGES, []);
  messages.unshift({ id: crypto.randomUUID(), ...clean, date: new Date().toISOString(), read: false });
  writeJSON(F_MESSAGES, messages.slice(0, 500));
  res.json({ ok: true });
});

/* ----- admin API ----- */
app.post('/api/login', loginLimiter, async (req, res) => {
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const admin = readJSON(F_ADMIN, {});
  const ok = admin.passwordHash && (await bcrypt.compare(password, admin.passwordHash));
  if (!ok) return res.status(401).json({ error: 'Incorrect password.' });
  res.json({ token: jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '8h' }) });
});

app.get('/api/admin/portfolio', requireAuth, (req, res) => res.json(readJSON(F_PORTFOLIO, {})));

app.put('/api/admin/portfolio', requireAuth, (req, res) => {
  const clean = cleanPortfolio(req.body);

  // best-effort cleanup: if the photo changed away from a previously uploaded file, remove it
  const prevPhoto = readJSON(F_PORTFOLIO, {})?.profile?.photo;
  if (typeof prevPhoto === 'string' && prevPhoto.startsWith('/uploads/') && prevPhoto !== clean.profile.photo) {
    fs.unlink(path.join(UPLOADS_DIR, path.basename(prevPhoto)), () => {});
  }

  writeJSON(F_PORTFOLIO, clean);
  res.json(clean);
});

app.post('/api/admin/upload/photo', requireAuth, uploadLimiter, (req, res) => {
  upload.single('photo')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Upload failed.' });
    if (!req.file) return res.status(400).json({ error: 'No file received.' });
    const ext = PHOTO_MIME_EXT[req.file.mimetype];
    const filename = 'photo-' + crypto.randomBytes(8).toString('hex') + ext;
    fs.writeFileSync(path.join(UPLOADS_DIR, filename), req.file.buffer);

    // best-effort cleanup of the previous uploaded photo, if any
    const current = readJSON(F_PORTFOLIO, {});
    const prev = current?.profile?.photo;
    if (typeof prev === 'string' && prev.startsWith('/uploads/')) {
      const prevPath = path.join(UPLOADS_DIR, path.basename(prev));
      fs.unlink(prevPath, () => {});
    }

    res.json({ url: '/uploads/' + filename });
  });
});

app.get('/api/admin/messages', requireAuth, (req, res) => res.json(readJSON(F_MESSAGES, [])));

app.patch('/api/admin/messages/:id', requireAuth, (req, res) => {
  const messages = readJSON(F_MESSAGES, []);
  const m = messages.find((x) => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: 'Message not found.' });
  m.read = req.body?.read !== false;
  writeJSON(F_MESSAGES, messages);
  res.json(m);
});

app.delete('/api/admin/messages/:id', requireAuth, (req, res) => {
  const messages = readJSON(F_MESSAGES, []).filter((x) => x.id !== req.params.id);
  writeJSON(F_MESSAGES, messages);
  res.json({ ok: true });
});

app.post('/api/admin/password', requireAuth, loginLimiter, async (req, res) => {
  const { current, next: newPass } = req.body || {};
  const admin = readJSON(F_ADMIN, {});
  if (!(await bcrypt.compare(String(current || ''), admin.passwordHash || ''))) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }
  if (typeof newPass !== 'string' || newPass.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }
  writeJSON(F_ADMIN, { passwordHash: await bcrypt.hash(newPass, 12) });
  res.json({ ok: true });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

/* ----- static files ----- */
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
app.get('/admin', (req, res) => res.redirect('/admin/'));

app.listen(PORT, () => {
  console.log(`  Portfolio running:  http://localhost:${PORT}`);
  console.log(`  Admin panel:        http://localhost:${PORT}/admin/`);
});
