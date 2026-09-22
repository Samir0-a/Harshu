/* Admin CMS logic. Vanilla JS, talks to /api/admin/* with a bearer token. */
(function () {
  'use strict';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => 'id-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

  let TOKEN = null;
  try { TOKEN = sessionStorage.getItem('adminToken'); } catch (_) {}
  let DATA = null;      // working copy of the portfolio document
  let DIRTY = false;

  const toast = (msg, isErr) => {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'toast show' + (isErr ? ' err' : '');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.classList.remove('show'); }, 2600);
  };

  async function api(path, opts = {}) {
    const res = await fetch(path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...(TOKEN ? { Authorization: 'Bearer ' + TOKEN } : {}), ...(opts.headers || {}) },
    });
    if (res.status === 401) { signOut(); throw new Error('Session expired. Please sign in again.'); }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || 'Something went wrong.');
    return body;
  }

  /* ---------- auth ---------- */
  function signOut() {
    TOKEN = null;
    try { sessionStorage.removeItem('adminToken'); } catch (_) {}
    $('#app').hidden = true;
    $('#loginScreen').hidden = false;
  }

  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#loginBtn'), err = $('#loginErr');
    const password = new FormData(e.currentTarget).get('password');
    btn.disabled = true; btn.textContent = 'Signing in...'; err.textContent = '';
    try {
      const out = await api('/api/login', { method: 'POST', body: JSON.stringify({ password }) });
      TOKEN = out.token;
      try { sessionStorage.setItem('adminToken', TOKEN); } catch (_) {}
      await boot();
    } catch (ex) {
      err.textContent = ex.message;
    } finally {
      btn.disabled = false; btn.textContent = 'Sign in';
    }
  });

  $('#logoutBtn').addEventListener('click', () => {
    if (DIRTY && !confirm('You have unsaved changes. Sign out anyway?')) return;
    signOut();
  });

  /* ---------- panel navigation ---------- */
  const TITLES = {
    profile: 'Profile & hero', settings: 'Site settings', stats: 'Highlights', skills: 'Skills',
    education: 'Education', experience: 'Experience', projects: 'Projects',
    certifications: 'Certifications', insights: 'Market notes', messages: 'Messages', account: 'Account',
  };
  $('#sideNav').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-panel]');
    if (!btn) return;
    $$('#sideNav button').forEach((b) => b.classList.toggle('active', b === btn));
    $$('.panel').forEach((p) => { p.hidden = p.dataset.panel !== btn.dataset.panel; });
    $('#panelTitle').textContent = TITLES[btn.dataset.panel] || '';
    if (btn.dataset.panel === 'messages') loadMessages();
  });

  /* ---------- generic binding for simple fields (profile/settings) ---------- */
  function getPath(obj, path) { return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj); }
  function setPath(obj, path, val) {
    const keys = path.split('.');
    let o = obj;
    for (let i = 0; i < keys.length - 1; i++) { o[keys[i]] = o[keys[i]] || {}; o = o[keys[i]]; }
    o[keys[keys.length - 1]] = val;
  }
  function fillBoundFields() {
    $$('[data-bind]').forEach((el) => {
      const v = getPath(DATA, el.dataset.bind);
      el.value = v == null ? '' : v;
    });
  }
  document.addEventListener('input', (e) => {
    const el = e.target.closest('[data-bind]');
    if (!el) return;
    setPath(DATA, el.dataset.bind, el.value);
    markDirty();
  });

  function markDirty() {
    DIRTY = true;
    const s = $('#saveState');
    s.textContent = 'Unsaved changes';
    s.className = 'save-state';
  }

  /* ---------- photo upload ---------- */
  function renderPhotoPreview() {
    const box = $('#photoPreview');
    const removeBtn = $('#photoRemoveBtn');
    const url = DATA.profile?.photo;
    if (url) {
      box.style.backgroundImage = `url("${url}")`;
      box.classList.add('has-image');
      box.textContent = '';
      removeBtn.hidden = false;
    } else {
      box.style.backgroundImage = '';
      box.classList.remove('has-image');
      box.textContent = 'No photo';
      removeBtn.hidden = true;
    }
  }

  $('#photoPickBtn').addEventListener('click', () => $('#photoFile').click());

  $('#photoFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    const status = $('#photoStatus');
    status.className = 'photo-status';
    if (file.size > 5 * 1024 * 1024) { status.textContent = 'That file is larger than 5MB.'; status.classList.add('err'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { status.textContent = 'Please choose a JPG, PNG or WEBP image.'; status.classList.add('err'); return; }

    status.textContent = 'Uploading...';
    const fd = new FormData();
    fd.append('photo', file);
    try {
      const res = await fetch('/api/admin/upload/photo', { method: 'POST', headers: TOKEN ? { Authorization: 'Bearer ' + TOKEN } : {}, body: fd });
      if (res.status === 401) { signOut(); throw new Error('Session expired. Please sign in again.'); }
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || 'Upload failed.');
      DATA.profile.photo = out.url;
      renderPhotoPreview();
      markDirty();
      status.textContent = 'Photo uploaded. Save changes to publish it.';
      status.classList.add('ok');
    } catch (ex) {
      status.textContent = ex.message;
      status.classList.add('err');
    }
  });

  $('#photoRemoveBtn').addEventListener('click', () => {
    DATA.profile.photo = '';
    renderPhotoPreview();
    markDirty();
    const status = $('#photoStatus');
    status.textContent = 'Photo removed. Save changes to publish.';
    status.className = 'photo-status ok';
  });

  /* ---------- section visibility switches ---------- */
  const SECTION_LABELS = { about: 'About', skills: 'Skills', education: 'Education', experience: 'Experience', projects: 'Projects', certifications: 'Certifications', insights: 'Market notes', contact: 'Contact' };
  function renderSwitches() {
    const wrap = $('#sectionSwitches');
    wrap.innerHTML = Object.entries(SECTION_LABELS).map(([key, label]) => `
      <label class="switch">
        <span>${label}</span>
        <input type="checkbox" data-section="${key}" ${DATA.sections?.[key] !== false ? 'checked' : ''}>
      </label>`).join('');
    wrap.addEventListener('change', (e) => {
      const el = e.target.closest('[data-section]');
      if (!el) return;
      DATA.sections = DATA.sections || {};
      DATA.sections[el.dataset.section] = el.checked;
      markDirty();
    });
  }

  /* ---------- generic reorderable list editor ---------- */
  // spec: { key, containerId, fields: [{name,label,type}], titleField, empty }
  const LIST_SPECS = {
    stats: { key: 'stats', containerId: 'listStats', cols: 'cols2', empty: 'No highlights yet.',
      fields: [{ n: 'label', l: 'Label', t: 'text' }, { n: 'value', l: 'Value', t: 'text' }],
      title: (i) => i.label || 'New highlight' },
    skills: { key: 'skills', containerId: 'listSkills', cols: 'cols3', empty: 'No skills yet.',
      fields: [{ n: 'name', l: 'Skill name', t: 'text' }, { n: 'category', l: 'Category', t: 'text' }, { n: 'level', l: 'Level (0-100)', t: 'range' }],
      title: (i) => i.name || 'New skill' },
    education: { key: 'education', containerId: 'listEducation', cols: 'cols2', empty: 'No education entries yet.',
      fields: [{ n: 'institution', l: 'Institution', t: 'text' }, { n: 'period', l: 'Period (e.g. 2023 - 2026)', t: 'text' }, { n: 'degree', l: 'Degree / programme', t: 'text', full: true }, { n: 'description', l: 'Description', t: 'textarea', full: true }],
      title: (i) => i.degree || 'New education entry' },
    experience: { key: 'experience', containerId: 'listExperience', cols: 'cols2', empty: 'No experience entries yet.',
      fields: [{ n: 'role', l: 'Role', t: 'text' }, { n: 'org', l: 'Organisation', t: 'text' }, { n: 'period', l: 'Period', t: 'text', full: true }, { n: 'description', l: 'Description', t: 'textarea', full: true }],
      title: (i) => i.role || 'New experience entry' },
    projects: { key: 'projects', containerId: 'listProjects', cols: 'cols2', empty: 'No projects yet.',
      fields: [{ n: 'title', l: 'Title', t: 'text' }, { n: 'link', l: 'Link (optional)', t: 'text' }, { n: 'tags', l: 'Tags, comma separated', t: 'text', full: true }, { n: 'description', l: 'Description', t: 'textarea', full: true }],
      title: (i) => i.title || 'New project' },
    certifications: { key: 'certifications', containerId: 'listCertifications', cols: 'cols3', empty: 'No certifications yet.',
      fields: [{ n: 'name', l: 'Name', t: 'text' }, { n: 'issuer', l: 'Issuer', t: 'text' }, { n: 'year', l: 'Year', t: 'text' }, { n: 'link', l: 'Link (optional)', t: 'text', full: true }],
      title: (i) => i.name || 'New certification' },
    insights: { key: 'insights', containerId: 'listInsights', cols: 'cols2', empty: 'No notes yet.',
      fields: [{ n: 'title', l: 'Title', t: 'text' }, { n: 'date', l: 'Date (e.g. August 2026)', t: 'text' }, { n: 'link', l: 'Link (optional)', t: 'text' }, { n: 'summary', l: 'Summary', t: 'textarea', full: true }],
      title: (i) => i.title || 'New note' },
  };

  function renderList(specKey) {
    const spec = LIST_SPECS[specKey];
    const list = DATA[spec.key] || (DATA[spec.key] = []);
    const wrap = $('#' + spec.containerId);
    if (!list.length) { wrap.innerHTML = `<p class="empty">${spec.empty}</p>`; return; }
    wrap.innerHTML = list.map((item, idx) => `
      <div class="item-card" draggable="true" data-idx="${idx}" data-id="${item.id}">
        <div class="item-head">
          <span class="drag" title="Drag to reorder" aria-hidden="true">&#8942;&#8942;</span>
          <span class="item-title">${esc(spec.title(item))}</span>
          <button class="btn danger icon-only" data-remove title="Remove">&#10005;</button>
        </div>
        <div class="item-body ${spec.cols}">
          ${spec.fields.map((f) => fieldHtml(spec.key, item, f)).join('')}
        </div>
      </div>`).join('');
  }

  function fieldHtml(specKey, item, f) {
    const val = item[f.n] == null ? '' : item[f.n];
    const fullClass = f.full ? 'style="grid-column:1/-1"' : '';
    if (f.t === 'textarea') {
      return `<label class="field" ${fullClass}><span>${f.l}</span><textarea rows="3" data-field="${f.n}">${esc(val)}</textarea></label>`;
    }
    if (f.t === 'range') {
      return `<label class="field" ${fullClass}><span>${f.l}</span>
        <span class="range-row"><input type="range" min="0" max="100" step="1" value="${Number(val) || 0}" data-field="${f.n}">
        <output>${Number(val) || 0}</output></span></label>`;
    }
    return `<label class="field" ${fullClass}><span>${f.l}</span><input type="text" value="${esc(val)}" data-field="${f.n}"></label>`;
  }

  // field edits
  document.addEventListener('input', (e) => {
    const card = e.target.closest('.item-card[data-id]');
    const field = e.target.closest('[data-field]');
    if (!card || !field) return;
    const specKey = findSpecByContainer(card.closest('[id^="list"]').id);
    if (!specKey) return;
    const item = DATA[LIST_SPECS[specKey].key].find((x) => x.id === card.dataset.id);
    if (!item) return;
    item[field.dataset.field] = field.type === 'range' ? Number(field.value) : field.value;
    if (field.type === 'range') field.nextElementSibling.textContent = field.value;
    const titleEl = card.querySelector('.item-title');
    if (titleEl) titleEl.textContent = LIST_SPECS[specKey].title(item);
    markDirty();
  });

  function findSpecByContainer(containerId) {
    return Object.keys(LIST_SPECS).find((k) => LIST_SPECS[k].containerId === containerId);
  }

  // add / remove
  document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('[data-add]');
    if (addBtn) {
      const spec = LIST_SPECS[addBtn.dataset.add];
      const blank = { id: uid() };
      spec.fields.forEach((f) => { blank[f.n] = f.t === 'range' ? 50 : ''; });
      DATA[spec.key].unshift(blank);
      renderList(addBtn.dataset.add);
      markDirty();
      const first = $('#' + spec.containerId + ' .item-card input, #' + spec.containerId + ' .item-card textarea');
      if (first) first.focus();
      return;
    }
    const rmBtn = e.target.closest('[data-remove]');
    if (rmBtn) {
      const card = rmBtn.closest('.item-card');
      const specKey = findSpecByContainer(card.closest('[id^="list"]').id);
      if (!specKey) return;
      if (!confirm('Remove this entry?')) return;
      const spec = LIST_SPECS[specKey];
      DATA[spec.key] = DATA[spec.key].filter((x) => x.id !== card.dataset.id);
      renderList(specKey);
      markDirty();
    }
  });

  // drag to reorder
  let dragSrc = null;
  document.addEventListener('dragstart', (e) => {
    const card = e.target.closest('.item-card');
    if (!card) return;
    dragSrc = card;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => card.style.opacity = '.4', 0);
  });
  document.addEventListener('dragend', (e) => {
    const card = e.target.closest('.item-card');
    if (card) card.style.opacity = '';
    dragSrc = null;
  });
  document.addEventListener('dragover', (e) => {
    const card = e.target.closest('.item-card');
    if (!card || !dragSrc || card === dragSrc) return;
    e.preventDefault();
    const container = card.parentElement;
    const rect = card.getBoundingClientRect();
    const before = (e.clientY - rect.top) < rect.height / 2;
    container.insertBefore(dragSrc, before ? card : card.nextSibling);
  });
  document.addEventListener('drop', (e) => {
    const list = e.target.closest('[id^="list"]');
    if (!list || !dragSrc) return;
    e.preventDefault();
    const specKey = findSpecByContainer(list.id);
    if (!specKey) return;
    const spec = LIST_SPECS[specKey];
    const order = $$('.item-card', list).map((c) => c.dataset.id);
    DATA[spec.key].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    markDirty();
  });

  function renderAllLists() { Object.keys(LIST_SPECS).forEach(renderList); }

  /* ---------- save ---------- */
  $('#saveBtn').addEventListener('click', async () => {
    const btn = $('#saveBtn'), state = $('#saveState');
    btn.disabled = true; btn.textContent = 'Saving...';
    try {
      const saved = await api('/api/admin/portfolio', { method: 'PUT', body: JSON.stringify(DATA) });
      DATA = saved;
      fillBoundFields(); renderPhotoPreview(); renderSwitches(); renderAllLists();
      DIRTY = false;
      state.textContent = 'All changes saved'; state.className = 'save-state ok';
      toast('Changes published to the live site.');
    } catch (ex) {
      state.textContent = 'Save failed'; state.className = 'save-state err';
      toast(ex.message, true);
    } finally {
      btn.disabled = false; btn.textContent = 'Save changes';
    }
  });
  window.addEventListener('beforeunload', (e) => { if (DIRTY) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- messages ---------- */
  let messagesLoaded = false;
  async function loadMessages(force) {
    if (messagesLoaded && !force) return;
    const wrap = $('#messagesList');
    wrap.innerHTML = '<p class="empty">Loading...</p>';
    try {
      const msgs = await api('/api/admin/messages');
      messagesLoaded = true;
      updateBadge(msgs);
      if (!msgs.length) { wrap.innerHTML = '<p class="empty">No messages yet.</p>'; return; }
      wrap.innerHTML = msgs.map((m) => `
        <div class="msg-card ${m.read ? '' : 'unread'}" data-id="${m.id}">
          <div class="msg-top">
            <span class="msg-from">${esc(m.name)} &middot; <a class="msg-email" href="mailto:${esc(m.email)}">${esc(m.email)}</a></span>
            <span class="msg-date">${new Date(m.date).toLocaleString()}</span>
          </div>
          <p class="msg-body">${esc(m.message)}</p>
          <div class="msg-actions">
            <button class="btn icon-only" data-toggle-read>${m.read ? 'Mark unread' : 'Mark read'}</button>
            <button class="btn danger" data-del-msg>Delete</button>
          </div>
        </div>`).join('');
    } catch (ex) {
      wrap.innerHTML = `<p class="empty">${esc(ex.message)}</p>`;
    }
  }
  function updateBadge(msgs) {
    const n = msgs.filter((m) => !m.read).length;
    const badge = $('#msgBadge');
    badge.hidden = !n;
    badge.textContent = n;
  }
  $('#messagesList').addEventListener('click', async (e) => {
    const card = e.target.closest('.msg-card');
    if (!card) return;
    const id = card.dataset.id;
    if (e.target.closest('[data-toggle-read]')) {
      const nowRead = card.classList.contains('unread');
      try { await api('/api/admin/messages/' + id, { method: 'PATCH', body: JSON.stringify({ read: nowRead }) }); loadMessages(true); }
      catch (ex) { toast(ex.message, true); }
    } else if (e.target.closest('[data-del-msg]')) {
      if (!confirm('Delete this message?')) return;
      try { await api('/api/admin/messages/' + id, { method: 'DELETE' }); loadMessages(true); }
      catch (ex) { toast(ex.message, true); }
    }
  });

  /* ---------- account ---------- */
  $('#pwForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = $('#pwStatus');
    const fd = new FormData(e.currentTarget);
    status.className = 'pw-status';
    try {
      await api('/api/admin/password', { method: 'POST', body: JSON.stringify({ current: fd.get('current'), next: fd.get('next') }) });
      status.textContent = 'Password updated.'; status.classList.add('ok');
      e.currentTarget.reset();
    } catch (ex) {
      status.textContent = ex.message; status.classList.add('err');
    }
  });

  /* ---------- boot ---------- */
  async function boot() {
    $('#loginScreen').hidden = true;
    $('#app').hidden = false;
    try {
      DATA = await api('/api/admin/portfolio');
      DATA.profile = DATA.profile || {}; DATA.settings = DATA.settings || {}; DATA.sections = DATA.sections || {};
      Object.keys(LIST_SPECS).forEach((k) => { DATA[LIST_SPECS[k].key] = DATA[LIST_SPECS[k].key] || []; });
      fillBoundFields();
      renderPhotoPreview();
      renderSwitches();
      renderAllLists();
      try { const msgs = await api('/api/admin/messages'); updateBadge(msgs); } catch (_) {}
    } catch (ex) {
      toast(ex.message, true);
      if (/session/i.test(ex.message)) signOut();
    }
  }

  if (TOKEN) boot(); else { $('#loginScreen').hidden = false; }
})();
