/* Public site: loads content from /api/portfolio and renders it. */
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isExternal = (u) => /^https?:\/\//i.test(u);
  const linkAttrs = (u) => `href="${esc(u)}"${isExternal(u) ? ' target="_blank" rel="noopener noreferrer"' : ''}`;

  const ICONS = {
    mail: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    link: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
    download: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0-4-4m4 4 4-4M4 20h16"/></svg>',
  };

  /* ---------- theme + nav chrome ---------- */
  const root = document.documentElement;
  $('#themeBtn').addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (_) {}
  });
  const navLinks = $('#navLinks');
  const menuBtn = $('#menuBtn');
  const setMenu = (open) => {
    navLinks.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  };
  menuBtn.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
  navLinks.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  $('#year').textContent = '\u00A9 ' + new Date().getFullYear();

  /* ---------- hero chart (decorative, seeded from the name so it is stable) ---------- */
  function drawChart(seedText) {
    let seed = 0;
    for (const ch of seedText || 'x') seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const n = 22, W = 480, top = 30, bottom = 205;
    const pts = [];
    let v = 0.12;
    for (let i = 0; i < n; i++) {
      v += 0.045 + (rand() - 0.42) * 0.11;
      v = Math.max(0.04, Math.min(1, v));
      pts.push([(i / (n - 1)) * W, bottom - v * (bottom - top)]);
    }
    pts[n - 1][1] = Math.min(pts[n - 1][1], top + 8);
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < n - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    $('#chartLine').setAttribute('d', d);
    $('#chartArea').setAttribute('d', `${d} L${W},240 L0,240 Z`);
  }

  /* ---------- rendering ---------- */
  const LABELS = { about: 'About', skills: 'Skills', education: 'Education', experience: 'Experience', projects: 'Projects', certifications: 'Certificates', insights: 'Notes', contact: 'Contact' };

  function render(d) {
    const p = d.profile || {};
    const s = d.settings || {};
    const show = (key, hasContent) => (d.sections ? d.sections[key] !== false : true) && hasContent;

    // theme accent
    if (/^#[0-9a-f]{6}$/i.test(s.accent || '')) root.style.setProperty('--accent', s.accent);

    // meta
    document.title = s.siteTitle || (p.name ? `${p.name} | Finance Portfolio` : 'Finance Portfolio');
    const metaDesc = $('meta[name="description"]');
    if (metaDesc && p.tagline) metaDesc.setAttribute('content', p.tagline);

    // brand
    const initials = (p.name || 'Me').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
    $('#brandMark').textContent = initials;
    $('#brandName').textContent = p.name || 'Portfolio';

    // hero
    $('#heroRole').textContent = p.title || '';
    $('#heroName').textContent = p.name || '';
    $('#heroTag').textContent = p.tagline || '';
    const cta = [];
    if (show('contact', true)) cta.push(`<a class="btn primary" href="#contact">Get in touch</a>`);
    if (show('projects', (d.projects || []).length)) cta.push(`<a class="btn" href="#projects">View projects</a>`);
    if (p.resumeUrl) cta.push(`<a class="btn" ${linkAttrs(p.resumeUrl)}>${ICONS.download} R\u00E9sum\u00E9</a>`);
    $('#heroCta').innerHTML = cta.join('');
    const meta = [];
    if (p.location) meta.push(`<li>${ICONS.pin}<span>${esc(p.location)}</span></li>`);
    if (p.email) meta.push(`<li>${ICONS.mail}<span>${esc(p.email)}</span></li>`);
    $('#heroMeta').innerHTML = meta.join('');

    // highlight readouts
    const stats = (d.stats || []).filter((x) => x.value || x.label);
    const ticker = $('.ticker');
    $('#readouts').innerHTML = stats.slice(0, 6).map((x) => `<div class="readout"><b>${esc(x.value)}</b><span>${esc(x.label)}</span></div>`).join('');
    $('#readouts').hidden = !stats.length;
    ticker.hidden = false;
    drawChart(p.name);

    // about
    const aboutParas = (p.about || '').split(/\n{2,}/).map((t) => t.trim()).filter(Boolean);
    $('#aboutBody').innerHTML = aboutParas.map((t) => `<p>${esc(t).replace(/\n/g, '<br>')}</p>`).join('');
    $('#aboutPhoto').innerHTML = p.photo ? `<img class="portrait" src="${esc(p.photo)}" alt="Portrait of ${esc(p.name)}" loading="lazy">` : '';

    // skills grouped by category, keeping first-seen order
    const groups = new Map();
    (d.skills || []).forEach((k) => {
      const cat = k.category || 'Skills';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat).push(k);
    });
    $('#skillsBody').innerHTML = [...groups].map(([cat, list]) => `
      <div class="skill-group">
        <h3>${esc(cat)}</h3>
        ${list.map((k) => `
          <div class="skill">
            <span class="skill-name">${esc(k.name)}</span>
            <span class="skill-val num">${Number(k.level) || 0}</span>
            <div class="bar" role="img" aria-label="${esc(k.name)}: ${Number(k.level) || 0} out of 100"><i data-level="${Number(k.level) || 0}"></i></div>
          </div>`).join('')}
      </div>`).join('');

    // timelines
    $('#eduBody').innerHTML = (d.education || []).map((e) => `
      <li class="tl-item">
        <div class="tl-period">${esc(e.period)}</div>
        <h3 class="tl-title">${esc(e.degree)}</h3>
        <div class="tl-org">${esc(e.institution)}</div>
        ${e.description ? `<p class="tl-desc">${esc(e.description)}</p>` : ''}
      </li>`).join('');
    $('#expBody').innerHTML = (d.experience || []).map((e) => `
      <li class="tl-item">
        <div class="tl-period">${esc(e.period)}</div>
        <h3 class="tl-title">${esc(e.role)}</h3>
        <div class="tl-org">${esc(e.org)}</div>
        ${e.description ? `<p class="tl-desc">${esc(e.description)}</p>` : ''}
      </li>`).join('');

    // projects
    $('#projBody').innerHTML = (d.projects || []).map((x) => {
      const tags = (x.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
      return `
      <article class="row">
        <div>
          <h3>${x.link ? `<a ${linkAttrs(x.link)}>${esc(x.title)}</a>` : esc(x.title)}</h3>
          ${x.description ? `<p>${esc(x.description)}</p>` : ''}
        </div>
        ${tags.length ? `<ul class="tags">${tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      </article>`;
    }).join('');

    // certifications
    $('#certBody').innerHTML = (d.certifications || []).map((c) => `
      <li class="cert">
        <strong>${c.link ? `<a ${linkAttrs(c.link)}>${esc(c.name)}</a>` : esc(c.name)}</strong>
        <span>${esc(c.issuer)}${c.issuer && c.year ? ', ' : ''}<span class="num">${esc(c.year)}</span></span>
      </li>`).join('');

    // insights
    $('#insBody').innerHTML = (d.insights || []).map((x) => `
      <article class="row">
        <div>
          <h3>${x.link ? `<a ${linkAttrs(x.link)}>${esc(x.title)}</a>` : esc(x.title)}</h3>
          ${x.summary ? `<p>${esc(x.summary)}</p>` : ''}
        </div>
        <div class="row-side">${esc(x.date)}</div>
      </article>`).join('');

    // contact list
    const cl = [];
    if (p.email) cl.push(`<li><a href="mailto:${esc(p.email)}">${ICONS.mail}<span>${esc(p.email)}</span></a></li>`);
    if (p.phone) cl.push(`<li><a href="tel:${esc(p.phone.replace(/[^\d+]/g, ''))}">${ICONS.phone}<span>${esc(p.phone)}</span></a></li>`);
    if (p.location) cl.push(`<li><span>${ICONS.pin}<span>${esc(p.location)}</span></span></li>`);
    if (p.linkedin) cl.push(`<li><a ${linkAttrs(p.linkedin)}>${ICONS.link}<span>LinkedIn</span></a></li>`);
    if (p.github) cl.push(`<li><a ${linkAttrs(p.github)}>${ICONS.link}<span>GitHub</span></a></li>`);
    if (p.twitter) cl.push(`<li><a ${linkAttrs(p.twitter)}>${ICONS.link}<span>X / Twitter</span></a></li>`);
    $('#contactList').innerHTML = cl.join('');

    $('#footerText').textContent = s.footerText || '';

    // section visibility + nav
    const has = {
      about: aboutParas.length || p.photo,
      skills: (d.skills || []).length,
      education: (d.education || []).length,
      experience: (d.experience || []).length,
      projects: (d.projects || []).length,
      certifications: (d.certifications || []).length,
      insights: (d.insights || []).length,
      contact: true,
    };
    const visible = [];
    Object.keys(LABELS).forEach((key) => {
      const el = document.getElementById(key);
      const on = !!show(key, has[key]);
      el.hidden = !on;
      if (on) visible.push(key);
    });
    navLinks.innerHTML = visible.map((k) => `<a href="#${k}" data-sec="${k}">${LABELS[k]}</a>`).join('');

    // alternate section backgrounds so visible sections always alternate
    visible.forEach((k, i) => document.getElementById(k).classList.toggle('alt', i % 2 === 1));

    setupObservers(visible);
  }

  function setupObservers(visible) {
    // animate skill bars when they scroll into view
    const bars = document.querySelectorAll('.bar > i');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if ('IntersectionObserver' in window && !reduce) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { en.target.style.width = en.target.dataset.level + '%'; io.unobserve(en.target); }
        });
      }, { threshold: 0.4 });
      bars.forEach((b) => io.observe(b));
    } else {
      bars.forEach((b) => { b.style.width = b.dataset.level + '%'; });
    }

    // highlight the current section in the nav
    if ('IntersectionObserver' in window) {
      const links = new Map([...navLinks.querySelectorAll('a')].map((a) => [a.dataset.sec, a]));
      const so = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            links.forEach((a) => a.classList.remove('active'));
            const a = links.get(en.target.id);
            if (a) a.classList.add('active');
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      visible.forEach((k) => so.observe(document.getElementById(k)));
    }
  }

  /* ---------- contact form ---------- */
  $('#contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const status = $('#formStatus');
    const btn = $('#sendBtn');
    const data = Object.fromEntries(new FormData(form));
    status.className = 'form-status';
    if (!data.name.trim() || !data.message.trim()) { status.textContent = 'Please enter your name and a message.'; status.classList.add('err'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) { status.textContent = 'Please enter a valid email address.'; status.classList.add('err'); return; }
    btn.disabled = true; btn.textContent = 'Sending...';
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || 'Message could not be sent.');
      form.reset();
      status.textContent = 'Message sent. Thank you, I will reply soon.';
      status.classList.add('ok');
    } catch (err) {
      status.textContent = err.message;
      status.classList.add('err');
    } finally {
      btn.disabled = false; btn.textContent = 'Send message';
    }
  });

  /* ---------- boot ---------- */
  fetch('/api/portfolio')
    .then((r) => { if (!r.ok) throw new Error('bad response'); return r.json(); })
    .then(render)
    .catch(() => {
      $('#heroName').textContent = 'Content unavailable';
      $('#heroTag').textContent = 'The portfolio data could not be loaded. Please refresh the page.';
    });
})();
