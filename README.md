# Finance Portfolio — with admin CMS

A personal portfolio website for a finance student, with a private admin
panel that edits everything shown on the public site (no code changes
needed to update content).

**Stack:** Node.js + Express backend · vanilla HTML/CSS/JS frontend ·
JWT + bcrypt for admin login. Storage adapts automatically to where it's
running — see [Deploying](#deploying) below.

## What's included

- **Public site** (`/`) — Hero, About, Skills, Education, Experience,
  Projects, Certifications, Market notes, and Contact (with a working
  contact form). Responsive, dark/light theme toggle, subtle motion,
  keyboard-accessible.
- **Admin panel** (`/admin/`) — Password-protected. Edit your profile,
  hero highlights, skills (with sliders), education, experience,
  projects, certifications, notes, site settings (accent colour, section
  on/off toggles), and read contact-form messages. Drag to reorder any
  list. Upload a profile photo straight from your device. One "Save
  changes" button publishes everything live.
- **API** — a small REST API (`lib/app.js`) backing both.

## Run it locally

```bash
npm install
npm start
```

Open **http://localhost:3000** for the site and **http://localhost:3000/admin/**
for the admin panel. Locally, content is stored as plain JSON files in
`data/` and uploaded photos are saved to `public/uploads/` — nothing else
to set up.

The first time you sign in to `/admin/`, an admin account is created
automatically using the password `ChangeMe123!` (printed in the terminal
the first time it's used). **Sign in and change that password immediately**
(Admin panel → Account). To set your own starting password instead, copy
`.env.example` to `.env` and set `ADMIN_PASSWORD` before the first run.

## Editing content

Everything on the public site — your name, bio, skills, education,
experience, projects, certifications, notes, contact links, accent
colour, and which sections are shown — is edited from `/admin/`. Changes
are only visible on the public site after you press **Save changes**.

**Adding your photo:** In the admin panel's Profile panel, use **Choose
photo…** to upload a JPG, PNG or WEBP (up to 5MB) straight from your
device. Uploading a new photo replaces the old one.

## Project structure

```
server.js              Local entrypoint (adds app.listen to lib/app.js)
api/index.js            Vercel entrypoint (same app, no listener)
vercel.json              Routes all /api/* requests to api/index.js
lib/app.js               Express app: routes, validation, auth
lib/storage.js            Content storage — local JSON files or Postgres
lib/photos.js             Photo storage — local disk or Vercel Blob
lib/seed.js               Starting content, used the very first time the
                           app runs (either mode)
data/                    Local-mode storage (git-ignored, auto-created)
public/                 Public site (index.html, css/, js/)
public/admin/           Admin panel (index.html, admin.css, admin.js)
public/uploads/         Local-mode uploaded photos (git-ignored)
```

## Deploying

This app runs two ways, using the same code:

### Option A — a normal Node host (Render, Railway, Fly.io, a VPS)

Any host that runs `npm install && npm start` works, and storage stays
as simple JSON files — nothing extra to configure. Notes:

- Set `PORT` if your host requires it (most set this automatically).
- Set `JWT_SECRET` to a long random string as an environment variable in
  production (otherwise one is generated and saved to `data/secret.json`
  — fine for a single server, but regenerates if that file is lost).
- The `data/` and `public/uploads/` folders must be on **persistent**
  storage — some hosts wipe the filesystem on redeploy, which would
  reset your content, admin password, and uploaded photo.
- Put the app behind HTTPS (most hosts do this for you) since the admin
  login sends a password.

### Option B — Vercel

Vercel's serverless functions don't have a persistent filesystem, so on
Vercel this app automatically switches to two Vercel-native services
instead of local files:

- **Postgres** (a small key/value table) for your content, admin
  password, and contact messages.
- **Blob** storage for uploaded photos.

Steps:

1. Push this project to a GitHub repo and import it into Vercel
   ("Add New… → Project").
2. In the project, go to **Storage → Create Database → Postgres**
   (this provisions a Neon-backed Postgres database and sets a
   `DATABASE_URL` environment variable automatically).
3. Go to **Storage → Create Database → Blob** the same way (sets
   `BLOB_READ_WRITE_TOKEN` automatically).
4. In **Settings → Environment Variables**, optionally set
   `ADMIN_PASSWORD` to your own starting password (otherwise it defaults
   to `ChangeMe123!` — sign in and change it right away either way). A
   `JWT_SECRET` is generated for you automatically and stored in
   Postgres, so it isn't required, but you can set your own if you'd
   rather not rely on that.
5. Deploy. Visit your `*.vercel.app` URL, then `/admin/` to sign in.

No other configuration is needed — `vercel.json` routes every `/api/*`
request to the same Express app, and it detects the Postgres/Blob
environment variables automatically and switches storage backends.

If you ever see a "No database connected yet" or "No photo storage
connected yet" error, it means step 2 or 3 above hasn't been completed
(or the project needs a redeploy after connecting them).

## Security notes

- Passwords are hashed with bcrypt; sessions use short-lived JWTs (8h).
- Login and password-change endpoints are rate-limited.
- All admin input is length-capped and validated server-side (URLs must
  be `http(s)://`, `mailto:`, or `tel:`; colours must be hex) regardless
  of what the browser sends.
- The contact form has a honeypot field and is rate-limited per IP.

## Customising the look

Colours, type and spacing live in `public/css/style.css` as CSS custom
properties at the top of the file (`--accent`, `--navy`, `--bg`, fonts,
etc.) — the accent colour can also be changed live from the admin panel
without touching code.
