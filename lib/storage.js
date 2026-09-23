'use strict';
/**
 * Storage abstraction so the same app code runs two ways:
 *
 *  - Any normal Node host (your own server, Render, Railway, local dev):
 *    content is stored as JSON files in data/, exactly as before.
 *
 *  - Vercel: Vercel's serverless functions have no writable, persistent
 *    filesystem, so when a Postgres database is connected (Storage tab in
 *    the Vercel dashboard → Create Database → Postgres, powered by Neon,
 *    which sets a DATABASE_URL env var), the whole document store lives in
 *    one small table there instead — read/written with Neon's own driver.
 *
 * Everything else in the app calls these functions and never touches
 * `fs` or SQL directly, so it doesn't need to know which mode it's in.
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { DEFAULT_PORTFOLIO } = require('./seed');

const ON_VERCEL = !!process.env.VERCEL;
// Neon's own docs recommend DATABASE_URL specifically; the older Vercel
// Postgres integration sometimes still sets POSTGRES_URL. Accept either so
// this doesn't break depending on exactly how the database was connected.
const CONNECTION_STRING = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
const USE_PG = !!CONNECTION_STRING;

let sql = null;
if (USE_PG) {
  // Lazily required so this package only needs to be installed/resolved
  // when it's actually going to be used.
  const { neon } = require('@neondatabase/serverless');
  sql = neon(CONNECTION_STRING);
}

function assertConfigured() {
  if (ON_VERCEL && !USE_PG) {
    const err = new Error(
      'No database connected yet. In your Vercel project, go to Storage \u2192 Create Database \u2192 Postgres, then redeploy.'
    );
    err.code = 'STORAGE_NOT_CONFIGURED';
    throw err;
  }
}

/* ---------- Postgres: one small key/value table (used on Vercel) ---------- */
let ensureTablePromise = null;
function ensureTable() {
  if (!ensureTablePromise) {
    ensureTablePromise = sql`
      CREATE TABLE IF NOT EXISTS portfolio_kv (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL
      )
    `;
  }
  return ensureTablePromise;
}
async function pgGet(key) {
  await ensureTable();
  const rows = await sql`SELECT value FROM portfolio_kv WHERE key = ${key}`;
  return rows[0]?.value ?? null;
}
async function pgSet(key, value) {
  await ensureTable();
  await sql`
    INSERT INTO portfolio_kv (key, value) VALUES (${key}, ${JSON.stringify(value)}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
}

/* ---------- local JSON file helpers (used when not on Vercel) ---------- */
const DATA_DIR = path.join(__dirname, '..', 'data');
const F_PORTFOLIO = path.join(DATA_DIR, 'portfolio.json');
const F_ADMIN = path.join(DATA_DIR, 'admin.json');
const F_SECRET = path.join(DATA_DIR, 'secret.json');
const F_MESSAGES = path.join(DATA_DIR, 'messages.json');

function readJSONFile(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return fallback; }
}
function writeJSONFile(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file); // atomic replace
}

/* ---------- portfolio content ---------- */
async function getPortfolio() {
  assertConfigured();
  let data = USE_PG ? await pgGet('portfolio') : readJSONFile(F_PORTFOLIO, null);
  if (!data) {
    data = DEFAULT_PORTFOLIO;
    await savePortfolio(data); // seed storage so this only happens once
  }
  return data;
}
async function savePortfolio(data) {
  assertConfigured();
  if (USE_PG) { await pgSet('portfolio', data); return data; }
  writeJSONFile(F_PORTFOLIO, data);
  return data;
}

/* ---------- admin account ---------- */
async function getAdmin() {
  assertConfigured();
  return USE_PG ? await pgGet('admin') : readJSONFile(F_ADMIN, null);
}
async function saveAdmin(data) {
  assertConfigured();
  if (USE_PG) { await pgSet('admin', data); return; }
  writeJSONFile(F_ADMIN, data);
}

/* ---------- contact-form messages ---------- */
async function getMessages() {
  assertConfigured();
  const list = USE_PG ? await pgGet('messages') : readJSONFile(F_MESSAGES, []);
  return list || [];
}
async function saveMessages(list) {
  assertConfigured();
  if (USE_PG) { await pgSet('messages', list); return; }
  writeJSONFile(F_MESSAGES, list);
}

/* ---------- JWT signing secret ---------- */
// Prefer an explicit JWT_SECRET env var (recommended in production).
// If none is set: on Vercel, generate one once and store it in Postgres so
// it survives cold starts; locally, generate one once and save it to disk.
async function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  assertConfigured();
  if (USE_PG) {
    let secret = await pgGet('secret');
    if (!secret) {
      secret = crypto.randomBytes(48).toString('hex');
      await pgSet('secret', secret);
    }
    return secret;
  }
  const saved = readJSONFile(F_SECRET, null);
  if (saved && saved.secret) return saved.secret;
  const secret = crypto.randomBytes(48).toString('hex');
  writeJSONFile(F_SECRET, { secret });
  return secret;
}

module.exports = {
  ON_VERCEL, USE_PG,
  getPortfolio, savePortfolio,
  getAdmin, saveAdmin,
  getMessages, saveMessages,
  getJwtSecret,
};
