(function () {
  const cfg = window.SD_CONFIG || {};
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  const STEPS = [
    { id: 'received', label: 'Brief received' },
    { id: 'researching', label: 'Context research' },
    { id: 'drafting', label: 'Survey design' },
    { id: 'review', label: 'Methodology review' },
    { id: 'delivered', label: 'Delivered' },
  ];

  function apiBase() {
    return (cfg.apiBase || '').replace(/\/$/, '');
  }

  if (!token) {
    document.getElementById('portal-title').textContent = 'Invalid link';
    document.getElementById('portal-error').hidden = false;
    document.getElementById('portal-error').textContent = 'Missing project token. Check the link in your confirmation email.';
    return;
  }

  function renderStatus(p) {
    document.getElementById('portal-title').textContent = p.companyName;
    document.getElementById('portal-summary').textContent =
      `${p.useCaseLabel} · ${p.tier} tier · Submitted ${new Date(p.createdAt).toLocaleDateString()}`;

    const statusEl = document.getElementById('portal-status');
    statusEl.innerHTML = `<div class="portal-badge" data-status="${p.status}">${p.statusLabel}</div>`;

    const activeIdx = STEPS.findIndex((s) => s.id === p.status);
    const stepsEl = document.getElementById('portal-steps');
    stepsEl.innerHTML = STEPS.map((s, i) => {
      let cls = 'received-step';
      if (p.status === 'revision' && s.id === 'delivered') cls += ' active';
      else if (p.status === 'closed' && i <= STEPS.length - 1) cls += ' done';
      else if (i < activeIdx) cls += ' done';
      else if (i === activeIdx || (p.status === 'revision' && s.id === 'drafting')) cls += ' active';
      return `<div class="${cls}">
        <div class="received-step-num">${i + 1}</div>
        <div><h3>${s.label}</h3></div>
      </div>`;
    }).join('');

    const note = document.getElementById('portal-note');
    if (p.deliverable) {
      note.textContent = 'Your survey deliverable is available below. Reply to your confirmation email for revisions.';
    } else if (p.status === 'delivered') {
      note.textContent = 'Your deliverable has been sent to your email. Reply to that message for revisions.';
    } else if (p.status === 'revision') {
      note.textContent = 'We are working on your revision request.';
    } else {
      const due = new Date(p.dueAt);
      note.textContent = `Target delivery: ${due.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}. Questions? Email ${cfg.contactEmail}.`;
    }
  }

  function renderDeliverable(p) {
    const panel = document.getElementById('portal-deliverable-panel');
    if (!p.deliverable) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    document.getElementById('deliverable-title').textContent = `${p.companyName} — survey instrument`;
    if (window.SD_renderDeliverable) {
      window.SD_renderDeliverable(p.deliverable, { companyName: p.companyName });
    }
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function load() {
    const url = `${apiBase()}/api/portal?token=${encodeURIComponent(token)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const out = await res.json();

    if (!out.success) {
      document.getElementById('portal-title').textContent = 'Project not found';
      document.getElementById('portal-error').hidden = false;
      document.getElementById('portal-error').textContent = out.message || 'Could not load project.';
      return;
    }

    const p = out.project;
    renderStatus(p);
    renderDeliverable(p);
  }

  load().catch(() => {
    document.getElementById('portal-title').textContent = 'Could not load';
    document.getElementById('portal-error').hidden = false;
    document.getElementById('portal-error').textContent = 'Network error. Try again later.';
  });
})();