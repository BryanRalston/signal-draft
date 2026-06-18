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

  function apiBase() {
    const b = (cfg.apiBase || '').replace(/\/$/, '');
    return b || '';
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

  const loginEl = document.getElementById('admin-login');
  const appEl = document.getElementById('admin-app');
  const boardEl = document.getElementById('admin-board');
  const modalEl = document.getElementById('admin-modal');
  let projects = [];
  let activeProject = null;

  function showToast(msg) {
    const el = document.getElementById('modal-toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    setTimeout(() => { el.hidden = true; }, 2500);
  }

  function dueLabel(dueAt) {
    if (!dueAt) return '';
    const due = new Date(dueAt);
    const hrs = Math.round((due - Date.now()) / 3600000);
    if (hrs < 0) return `Overdue ${Math.abs(hrs)}h`;
    if (hrs < 24) return `Due in ${hrs}h`;
    return `Due in ${Math.round(hrs / 24)}d`;
  }

  function renderBoard() {
    if (!boardEl) return;
    const overdue = projects.filter((p) => p.status !== 'delivered' && p.status !== 'closed' && new Date(p.due_at) < new Date()).length;
    const stats = document.getElementById('admin-stats');
    if (stats) stats.textContent = `${projects.length} projects${overdue ? ` · ${overdue} overdue` : ''}`;

    boardEl.innerHTML = STATUSES.map((col) => {
      const cards = projects.filter((p) => p.status === col.id);
      return `<div class="admin-column">
        <div class="admin-column-head">
          <span>${col.label}</span>
          <span class="admin-count">${cards.length}</span>
        </div>
        <div class="admin-cards">
          ${cards.map((p) => {
            const late = p.status !== 'delivered' && p.status !== 'closed' && new Date(p.due_at) < new Date();
            return `<button type="button" class="admin-card${late ? ' overdue' : ''}" data-id="${p.id}">
              <strong>${p.company_name}</strong>
              <span>${p.contact_name}</span>
              <span class="admin-card-meta">${p.use_case} · ${dueLabel(p.due_at)}</span>
            </button>`;
          }).join('') || '<p class="admin-empty">—</p>'}
        </div>
      </div>`;
    }).join('');

    boardEl.querySelectorAll('.admin-card').forEach((btn) => {
      btn.addEventListener('click', () => openProject(btn.dataset.id));
    });
  }

  async function loadProjects() {
    const out = await api('/api/admin/projects');
    projects = out.projects || [];
    renderBoard();
  }

  function intakeHtml(intake) {
    if (!intake) return '';
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
      `<div class="admin-intake-row"><dt>${k}</dt><dd>${String(v).replace(/</g, '&lt;')}</dd></div>`
    ).join('');
  }

  async function openProject(id) {
    const out = await api(`/api/admin/project?id=${encodeURIComponent(id)}&prompt=1`);
    activeProject = out.project;
    const p = activeProject;

    document.getElementById('modal-title').textContent = p.company_name;
    document.getElementById('modal-meta').textContent =
      `${p.contact_name} <${p.contact_email}> · ${p.use_case} · ${p.tier} · ${dueLabel(p.due_at)}`;

    const sel = document.getElementById('modal-status');
    sel.innerHTML = STATUSES.map((s) =>
      `<option value="${s.id}"${s.id === p.status ? ' selected' : ''}>${s.label}</option>`
    ).join('');

    document.getElementById('modal-notes').value = p.operator_notes || '';
    document.getElementById('modal-intake').innerHTML = intakeHtml(p.intake_json);

    const portalBase = apiBase() || window.location.origin;
    document.getElementById('btn-portal-link').href =
      `${portalBase}/portal/?token=${encodeURIComponent(p.client_token)}`;

    activeProject._grokPrompt = out.grokPrompt;
    modalEl.hidden = false;
  }

  function closeModal() {
    modalEl.hidden = true;
    activeProject = null;
  }

  async function saveStatus() {
    if (!activeProject) return;
    const status = document.getElementById('modal-status').value;
    await api('/api/admin/projects', {
      method: 'PATCH',
      body: JSON.stringify({ id: activeProject.id, status }),
    });
    showToast('Status saved');
    await loadProjects();
    closeModal();
  }

  async function saveNotes() {
    if (!activeProject) return;
    const operator_notes = document.getElementById('modal-notes').value;
    await api('/api/admin/projects', {
      method: 'PATCH',
      body: JSON.stringify({ id: activeProject.id, operator_notes }),
    });
    showToast('Notes saved');
    await loadProjects();
  }

  async function copyPrompt() {
    if (!activeProject?._grokPrompt) {
      const out = await api(`/api/admin/project?id=${encodeURIComponent(activeProject.id)}&prompt=1`);
      activeProject._grokPrompt = out.grokPrompt;
    }
    await navigator.clipboard.writeText(activeProject._grokPrompt);
    showToast('Grok prompt copied');
  }

  function showApp() {
    loginEl.hidden = true;
    appEl.hidden = false;
  }

  function showLogin() {
    sessionStorage.removeItem(TOKEN_KEY);
    loginEl.hidden = false;
    appEl.hidden = true;
  }

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
      await loadProjects();
    } catch (ex) {
      errEl.textContent = ex.message || 'Sign-in failed';
      errEl.hidden = false;
    }
  });

  document.getElementById('btn-refresh')?.addEventListener('click', () => loadProjects().catch(() => alert('Refresh failed')));
  document.getElementById('btn-logout')?.addEventListener('click', showLogin);
  document.getElementById('btn-save-status')?.addEventListener('click', () => saveStatus().catch((e) => alert(e.message)));
  document.getElementById('btn-save-notes')?.addEventListener('click', () => saveNotes().catch((e) => alert(e.message)));
  document.getElementById('btn-copy-prompt')?.addEventListener('click', () => copyPrompt().catch((e) => alert(e.message)));
  modalEl?.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeModal));

  if (sessionStorage.getItem(TOKEN_KEY)) {
    showApp();
    loadProjects().catch(showLogin);
  }
})();