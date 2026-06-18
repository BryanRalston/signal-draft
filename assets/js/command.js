(function () {
  const cfg = window.SD_CONFIG || {};
  const TOKEN_KEY = 'sd_admin_token';
  const STATUSES = [
    { id: 'received', label: 'Received' },
    { id: 'researching', label: 'Researching' },
    { id: 'drafting', label: 'Drafting' },
    { id: 'review', label: 'Review' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'revision', label: 'Revision' },
    { id: 'closed', label: 'Closed' },
  ];
  const VIEW_TITLES = {
    dashboard: ['Dashboard', 'Growth Operator feed · live pipeline'],
    pipeline: ['Pipeline', 'Kanban by delivery stage'],
    clients: ['Clients', 'Searchable client registry'],
    growth: ['Growth', 'Phase gates · founding program · history'],
  };

  let dashboard = null;
  let projects = [];
  let activeProject = null;

  function apiBase() {
    return (cfg.apiBase || '').replace(/\/$/, '');
  }

  function authHeaders() {
    const token = sessionStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function api(path, options = {}) {
    const url = `${apiBase()}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...authHeaders(),
        ...(options.headers || {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
  }

  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function dueLabel(dueAt) {
    if (!dueAt) return '—';
    const due = new Date(dueAt);
    const hrs = Math.round((due - Date.now()) / 3600000);
    if (hrs < 0) return `${Math.abs(hrs)}h overdue`;
    if (hrs < 24) return `${hrs}h left`;
    return `${Math.round(hrs / 24)}d left`;
  }

  function isOverdue(p) {
    return p.status !== 'delivered' && p.status !== 'closed' && p.due_at && new Date(p.due_at) < new Date();
  }

  function statusLabel(id) {
    return STATUSES.find((s) => s.id === id)?.label || id;
  }

  function phaseLabel(phase) {
    const map = {
      '1-activation': 'Phase 1 · Activation',
      '1-ops': 'Phase 1 · Operations',
      '2': 'Phase 2 · Productize',
    };
    return map[phase] || phase;
  }

  function showToast(msg) {
    const el = document.getElementById('drawer-toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    setTimeout(() => { el.hidden = true; }, 2500);
  }

  function setSync(text) {
    const el = document.getElementById('sync-status');
    if (el) el.textContent = text;
  }

  /* --- Views --- */
  function switchView(name) {
    document.querySelectorAll('.cmd-nav-item').forEach((b) => {
      b.classList.toggle('active', b.dataset.view === name);
    });
    document.querySelectorAll('.cmd-view').forEach((v) => {
      v.classList.toggle('active', v.id === `view-${name}`);
    });
    const [title, sub] = VIEW_TITLES[name] || ['Command', ''];
    document.getElementById('view-title').textContent = title;
    document.getElementById('view-subtitle').textContent = sub;
    document.getElementById('cmd-sidebar')?.classList.remove('open');
  }

  /* --- Render dashboard --- */
  function renderMetrics() {
    const c = dashboard?.counts || {};
    const m = dashboard?.growth?.metrics || {};
    const row = document.getElementById('metric-row');
    if (!row) return;
    const items = [
      { value: c.active ?? 0, label: 'Active in pipeline', cls: '' },
      { value: c.overdue ?? 0, label: 'SLA overdue', cls: c.overdue ? 'fail' : '' },
      { value: c.founding_remaining ?? m.founding_slots_remaining ?? 10, label: 'Founding slots left', cls: '' },
      { value: c.delivered ?? 0, label: 'Delivered', cls: '' },
    ];
    row.innerHTML = items.map((i) =>
      `<div class="cmd-metric ${i.cls}">
        <div class="cmd-metric-value">${i.value}</div>
        <div class="cmd-metric-label">${i.label}</div>
      </div>`
    ).join('');
  }

  function renderRecommendation() {
    const rec = dashboard?.recommendation;
    const text = document.getElementById('rec-text');
    if (text) text.textContent = rec?.recommendation || 'No open recommendations — pipeline clear.';
    document.getElementById('north-star').textContent = dashboard?.growth?.north_star || '—';
    const phase = dashboard?.growth?.phase || '1-activation';
    document.getElementById('hero-phase-badge').textContent = phaseLabel(phase);
    document.getElementById('sidebar-phase').textContent = phaseLabel(phase);
  }

  function renderBlockers() {
    const el = document.getElementById('blockers-list');
    const blockers = dashboard?.growth?.blockers || [];
    if (!el) return;
    if (!blockers.length) {
      el.innerHTML = '<p class="cmd-empty">No blockers — you are clear to grow.</p>';
      return;
    }
    el.innerHTML = blockers.map((b) =>
      `<div class="cmd-blocker">
        <div class="cmd-blocker-head">
          <span class="cmd-severity ${b.severity}">${b.severity}</span>
          <span class="cmd-blocker-title">${esc(b.title)}</span>
        </div>
        ${b.resolution_steps?.length ? `<ol class="cmd-blocker-steps">${b.resolution_steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
      </div>`
    ).join('');
  }

  function renderPulse() {
    const el = document.getElementById('pulse-grid');
    const pulse = dashboard?.pulse;
    const db = dashboard?.db_connected;
    if (!el) return;
    const items = [
      { label: 'Marketing (GitHub Pages)', ok: pulse?.marketing?.live },
      { label: 'Vercel API', ok: pulse?.summary?.vercel_live },
      { label: 'Supabase configured', ok: pulse?.summary?.supabase_configured },
      { label: 'Database connected', ok: db },
      { label: 'Intake API', ok: pulse?.summary?.intake_path_ready },
    ];
    el.innerHTML = items.map((i) =>
      `<div class="cmd-pulse-item">
        <span class="cmd-pulse-left">
          <span class="cmd-pulse-dot ${i.ok ? 'ok' : 'bad'}"></span>
          ${esc(i.label)}
        </span>
        <span style="font-family:var(--font-mono);font-size:0.75rem;color:var(--parchment-dim)">${i.ok ? 'Live' : 'Down'}</span>
      </div>`
    ).join('');
  }

  function renderGates(containerId) {
    const el = document.getElementById(containerId);
    const gates = dashboard?.growth?.phase_gates;
    if (!el || !gates) return;
    el.innerHTML = Object.entries(gates).map(([key, group]) => {
      const items = group.items || [];
      const done = items.filter((i) => i.status === 'done').length;
      const pct = items.length ? Math.round((done / items.length) * 100) : 0;
      return `<div class="cmd-gate-group">
        <div class="cmd-gate-label">${esc(group.label)} · ${done}/${items.length}</div>
        <div class="cmd-gate-bar"><div class="cmd-gate-fill" style="width:${pct}%"></div></div>
        <div class="cmd-gate-items">
          ${items.map((i) =>
            `<div class="cmd-gate-item ${i.status === 'done' ? 'done' : ''}">
              <span class="cmd-gate-check">${i.status === 'done' ? '✓' : ''}</span>
              <span>${esc(i.title)}</span>
            </div>`
          ).join('')}
        </div>
      </div>`;
    }).join('');
  }

  function renderRecent() {
    const el = document.getElementById('recent-clients');
    const recent = dashboard?.recent_projects || projects.slice(0, 6);
    if (!el) return;
    if (!recent.length) {
      el.innerHTML = '<p class="cmd-empty">No clients yet — activate infra and share the intake link.</p>';
      return;
    }
    el.innerHTML = recent.map((p) =>
      `<button type="button" class="cmd-recent-row" data-id="${p.id}">
        <div>
          <strong>${esc(p.company_name)}</strong>
          <span>${esc(p.contact_name)} · ${esc(p.use_case)}</span>
        </div>
        <span class="cmd-status-chip${isOverdue(p) ? ' overdue' : ''}">${statusLabel(p.status)}</span>
      </button>`
    ).join('');
    el.querySelectorAll('[data-id]').forEach((btn) => {
      btn.addEventListener('click', () => openProject(btn.dataset.id));
    });
  }

  function renderPipeline() {
    const stats = document.getElementById('pipeline-stats');
    const overdue = projects.filter(isOverdue).length;
    if (stats) stats.textContent = `${projects.length} clients · ${overdue} overdue`;

    const board = document.getElementById('pipeline-board');
    if (!board) return;
    board.innerHTML = STATUSES.map((col) => {
      const cards = projects.filter((p) => p.status === col.id);
      return `<div class="cmd-column">
        <div class="cmd-column-head">
          <span>${col.label}</span>
          <span class="cmd-column-count">${cards.length}</span>
        </div>
        <div class="cmd-column-cards">
          ${cards.map((p) =>
            `<button type="button" class="cmd-card${isOverdue(p) ? ' overdue' : ''}" data-id="${p.id}">
              <strong>${esc(p.company_name)}</strong>
              <span>${esc(p.contact_name)}</span>
              <span class="cmd-card-meta">${esc(p.use_case)} · ${dueLabel(p.due_at)}</span>
            </button>`
          ).join('') || '<p class="cmd-empty">—</p>'}
        </div>
      </div>`;
    }).join('');
    board.querySelectorAll('[data-id]').forEach((btn) => {
      btn.addEventListener('click', () => openProject(btn.dataset.id));
    });
  }

  function renderClients() {
    const q = (document.getElementById('client-search')?.value || '').toLowerCase();
    const filter = document.getElementById('client-filter')?.value || '';
    const tbody = document.getElementById('clients-tbody');
    if (!tbody) return;

    let list = [...projects];
    if (filter) list = list.filter((p) => p.status === filter);
    if (q) {
      list = list.filter((p) =>
        [p.company_name, p.contact_name, p.contact_email, p.use_case].some((f) =>
          String(f || '').toLowerCase().includes(q)
        )
      );
    }

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--parchment-dim);padding:2rem">No clients match</td></tr>';
      return;
    }

    tbody.innerHTML = list.map((p) =>
      `<tr data-id="${p.id}">
        <td><strong>${esc(p.company_name)}</strong></td>
        <td>${esc(p.contact_name)}<br><span style="font-size:0.75rem;color:var(--parchment-dim)">${esc(p.contact_email)}</span></td>
        <td>${esc(p.use_case)}</td>
        <td><span class="cmd-status-chip">${statusLabel(p.status)}</span></td>
        <td class="${isOverdue(p) ? 'overdue' : ''}">${dueLabel(p.due_at)}</td>
        <td><span class="cmd-link">Open →</span></td>
      </tr>`
    ).join('');
    tbody.querySelectorAll('[data-id]').forEach((row) => {
      row.addEventListener('click', () => openProject(row.dataset.id));
    });
  }

  function renderGrowth() {
    const m = dashboard?.growth?.metrics || {};
    const dl = document.getElementById('growth-metrics');
    if (dl) {
      const rows = [
        ['Total clients', m.clients_total ?? 0],
        ['Delivered', m.clients_delivered ?? 0],
        ['SLA overdue', m.sla_overdue_count ?? 0],
        ['Turnaround SLA', `${m.turnaround_hours || cfg.turnaroundHours || 48}h`],
        ['Phase', phaseLabel(dashboard?.growth?.phase)],
      ];
      dl.innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    }

    const total = m.founding_slots_total || cfg.foundingSlots || 10;
    const remaining = m.founding_slots_remaining ?? total;
    const used = total - remaining;
    const pct = total ? Math.round((used / total) * 100) : 0;
    const fw = document.getElementById('founding-widget');
    if (fw) {
      fw.innerHTML = `
        <div class="cmd-founding-ring" style="--pct:${pct}%">
          <span class="cmd-founding-num">${remaining}</span>
        </div>
        <p><strong>${remaining}</strong> of <strong>${total}</strong> founding slots available</p>
        <p style="margin-top:0.35rem;font-size:0.8125rem">${used} engaged</p>`;
    }

    const hist = document.getElementById('rec-history');
    const logs = [...(dashboard?.growth?.recommendations_log || [])].reverse();
    if (hist) {
      hist.innerHTML = logs.length
        ? logs.map((r) =>
            `<div class="cmd-rec-entry ${r.status || 'open'}">
              <time>${r.at ? new Date(r.at).toLocaleString() : '—'}</time>
              ${esc(r.recommendation)}
            </div>`
          ).join('')
        : '<p class="cmd-empty">No history yet</p>';
    }
    renderGates('growth-gates');
  }

  function renderAll() {
    renderMetrics();
    renderRecommendation();
    renderBlockers();
    renderPulse();
    renderGates('phase-gates');
    renderRecent();
    renderPipeline();
    renderClients();
    renderGrowth();
  }

  /* --- Data load --- */
  async function loadDashboard() {
    setSync('Syncing…');
    try {
      const data = await api('/api/admin/dashboard');
      dashboard = data;
      projects = data.projects || [];
      renderAll();
      setSync(`Updated ${new Date().toLocaleTimeString()}`);
    } catch (e) {
      await loadFallback(e.message);
    }
  }

  async function loadFallback(errMsg) {
    try {
      const res = await fetch('../data/growth-state.json');
      const partial = res.ok ? await res.json() : {};
      dashboard = {
        growth: {
          ...partial,
          north_star: partial.north_star || 'First paying founding client delivered within 48h SLA',
          phase: partial.phase || '1-activation',
          blockers: [
            { id: 'offline', severity: 'critical', title: 'API not reachable — demo mode', resolution_steps: [
              'Deploy to Vercel with Supabase env vars',
              'Open /command/ on your Vercel URL',
              errMsg ? `Error: ${errMsg}` : 'Sign in requires live API',
            ]},
          ],
          metrics: { founding_slots_total: cfg.foundingSlots || 10, founding_slots_remaining: cfg.foundingSlots || 10 },
          phase_gates: {},
          recommendations_log: [],
        },
        counts: { active: 0, overdue: 0, delivered: 0, founding_remaining: cfg.foundingSlots || 10 },
        recommendation: {
          recommendation: 'Deploy SignalDraft to Vercel and connect Supabase to unlock the full CRM.',
          status: 'open',
        },
        projects: [],
        recent_projects: [],
        pulse: null,
        db_connected: false,
      };
      projects = [];
      renderAll();
      setSync('Demo mode · API offline');
    } catch {
      setSync('Load failed');
    }
  }

  /* --- Client drawer --- */
  function intakeHtml(intake) {
    if (!intake) return '<p class="cmd-empty">No intake data</p>';
    const rows = [
      ['Company URL', intake.companyUrl],
      ['Industry', intake.industry],
      ['Description', intake.description],
      ['Business objective', intake.businessObjective],
      ['Research objectives', intake.researchObjectives],
      ['Competitors', intake.hypotheses],
      ['Audience', intake.audience],
      ['Sample size', intake.sampleSize],
      ['Incidence', intake.incidence],
      ['Decision rules', intake.decisionRules],
      ['Deliverables', Array.isArray(intake.deliverables) ? intake.deliverables.join(', ') : intake.deliverables],
      ['Notes', intake.notes],
    ];
    return rows.filter(([, v]) => v).map(([k, v]) =>
      `<div class="cmd-intake-row"><dt>${k}</dt><dd>${esc(v)}</dd></div>`
    ).join('');
  }

  async function openProject(id) {
    const out = await api(`/api/admin/project?id=${encodeURIComponent(id)}&prompt=1`);
    activeProject = out.project;
    const p = activeProject;

    document.getElementById('drawer-title').textContent = p.company_name;
    document.getElementById('drawer-meta').textContent =
      `${p.contact_name} <${p.contact_email}> · ${p.use_case} · ${dueLabel(p.due_at)}`;

    const sel = document.getElementById('drawer-status');
    sel.innerHTML = STATUSES.map((s) =>
      `<option value="${s.id}"${s.id === p.status ? ' selected' : ''}>${s.label}</option>`
    ).join('');

    document.getElementById('drawer-notes').value = p.operator_notes || '';
    document.getElementById('drawer-intake').innerHTML = intakeHtml(p.intake_json);

    const portalBase = apiBase() || window.location.origin;
    document.getElementById('btn-portal-link').href =
      `${portalBase}/portal/?token=${encodeURIComponent(p.client_token)}`;

    activeProject._grokPrompt = out.grokPrompt;
    document.getElementById('cmd-drawer').hidden = false;
  }

  function closeDrawer() {
    document.getElementById('cmd-drawer').hidden = true;
    activeProject = null;
  }

  async function saveStatus() {
    if (!activeProject) return;
    const status = document.getElementById('drawer-status').value;
    await api('/api/admin/projects', {
      method: 'PATCH',
      body: JSON.stringify({ id: activeProject.id, status }),
    });
    showToast('Status saved');
    await loadDashboard();
    closeDrawer();
  }

  async function saveNotes() {
    if (!activeProject) return;
    const operator_notes = document.getElementById('drawer-notes').value;
    await api('/api/admin/projects', {
      method: 'PATCH',
      body: JSON.stringify({ id: activeProject.id, operator_notes }),
    });
    showToast('Notes saved');
    await loadDashboard();
  }

  async function copyPrompt() {
    if (!activeProject?._grokPrompt) {
      const out = await api(`/api/admin/project?id=${encodeURIComponent(activeProject.id)}&prompt=1`);
      activeProject._grokPrompt = out.grokPrompt;
    }
    await navigator.clipboard.writeText(activeProject._grokPrompt);
    showToast('Grok prompt copied');
  }

  async function dismissRecommendation() {
    const rec = dashboard?.recommendation;
    if (!rec?.id) {
      showToast('No tracked recommendation to dismiss');
      return;
    }
    try {
      await api('/api/admin/growth', {
        method: 'PATCH',
        body: JSON.stringify({ dismiss_recommendation_id: rec.id }),
      });
      await loadDashboard();
    } catch {
      showToast('Saved locally — sync when API is live');
    }
  }

  /* --- Auth --- */
  function showApp() {
    document.getElementById('cmd-login').hidden = true;
    document.getElementById('cmd-app').hidden = false;
  }

  function showLogin() {
    sessionStorage.removeItem(TOKEN_KEY);
    document.getElementById('cmd-login').hidden = false;
    document.getElementById('cmd-app').hidden = true;
  }

  /* --- Init --- */
  const filterSel = document.getElementById('client-filter');
  if (filterSel) {
    STATUSES.forEach((s) => {
      const o = document.createElement('option');
      o.value = s.id;
      o.textContent = s.label;
      filterSel.appendChild(o);
    });
  }

  document.querySelectorAll('.cmd-nav-item').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  document.querySelectorAll('[data-goto]').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.goto));
  });

  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('login-error');
    errEl.hidden = true;
    try {
      const password = document.getElementById('admin-password').value;
      const out = await api('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      sessionStorage.setItem(TOKEN_KEY, out.token);
      showApp();
      await loadDashboard();
    } catch (ex) {
      errEl.textContent = ex.message || 'Sign-in failed';
      errEl.hidden = false;
    }
  });

  document.getElementById('btn-refresh')?.addEventListener('click', () => loadDashboard());
  document.getElementById('btn-logout')?.addEventListener('click', showLogin);
  document.getElementById('btn-menu')?.addEventListener('click', () => {
    document.getElementById('cmd-sidebar')?.classList.toggle('open');
  });
  document.getElementById('btn-save-status')?.addEventListener('click', () => saveStatus().catch((e) => alert(e.message)));
  document.getElementById('btn-save-notes')?.addEventListener('click', () => saveNotes().catch((e) => alert(e.message)));
  document.getElementById('btn-copy-prompt')?.addEventListener('click', () => copyPrompt().catch((e) => alert(e.message)));
  document.getElementById('btn-rec-done')?.addEventListener('click', () => dismissRecommendation());
  document.getElementById('client-search')?.addEventListener('input', renderClients);
  document.getElementById('client-filter')?.addEventListener('change', renderClients);
  document.getElementById('cmd-drawer')?.querySelectorAll('[data-close]').forEach((el) => {
    el.addEventListener('click', closeDrawer);
  });

  async function enterDemoPreview() {
    sessionStorage.setItem(TOKEN_KEY, 'demo-local-preview');
    showApp();
    await loadFallback('Local preview — connect Vercel API for live data');
  }

  if (new URLSearchParams(location.search).has('demo')) {
    enterDemoPreview();
  } else if (sessionStorage.getItem(TOKEN_KEY)) {
    showApp();
    loadDashboard().catch(showLogin);
  }
})();