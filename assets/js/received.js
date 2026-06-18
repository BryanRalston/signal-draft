(function () {
  const cfg = window.SD_CONFIG;
  const params = new URLSearchParams(window.location.search);

  let brief = null;
  try {
    const raw = sessionStorage.getItem('sd_submitted_brief');
    if (raw) brief = JSON.parse(raw);
  } catch (_) { /* */ }

  if (!brief && params.get('demo') !== '1') {
    window.location.replace('index.html');
    return;
  }

  if (!brief) {
    brief = {
      companyName: 'Your company',
      contactName: 'there',
      contactEmail: '',
      useCase: params.get('case') || 'csat',
    };
  }

  const useCase = brief.useCase || 'csat';
  const uc = (window.SD_USE_CASES || []).find((u) => u.id === useCase);
  const hours = cfg.turnaroundHours || 48;

  const summary = document.getElementById('received-summary');
  if (summary) {
    summary.textContent = `Thanks, ${brief.contactName || 'there'}. We received the brief for ${brief.companyName || 'your company'}${uc ? ` (${uc.label.toLowerCase()})` : ''}. You'll hear from us at ${brief.contactEmail || cfg.contactEmail} within ${hours} hours.`;
  }

  const stepsEl = document.getElementById('received-steps');
  if (stepsEl) {
    const steps = [
      { n: '1', title: 'We review your brief', desc: 'Your intake lands in our queue — objectives, audience, and decision rules.' },
      { n: '2', title: 'Context research', desc: 'We research your company, competitors, and market from public sources with citations.' },
      { n: '3', title: 'Survey design + review', desc: 'Questions are mapped to your objectives, then human-reviewed for methodology.' },
      { n: '4', title: 'Delivery', desc: 'You receive the dossier, instrument blueprint, and next steps — with revision rounds per your tier.' },
    ];
    stepsEl.innerHTML = steps.map((s) => `
      <div class="received-step">
        <div class="received-step-num">${s.n}</div>
        <div>
          <h3>${s.title}</h3>
          <p>${s.desc}</p>
        </div>
      </div>
    `).join('');
  }

  const sampleLink = document.getElementById('received-sample');
  if (sampleLink) {
    sampleLink.href = `preview.html?case=${encodeURIComponent(useCase)}&sample=1`;
  }

  const note = document.getElementById('received-note');
  if (note) {
    let text = `Questions before we start? Email ${cfg.contactEmail} — reference ${brief.companyName || 'your company'}.`;
    if (brief.clientToken) {
      const base = (cfg.apiBase || '').replace(/\/$/, '')
        || (window.location.hostname.includes('github.io') ? '' : window.location.origin);
      if (!base) {
        note.textContent = text;
        return;
      }
      const portalUrl = `${base}/portal/?token=${encodeURIComponent(brief.clientToken)}`;
      text += ` Track status: ${portalUrl}`;
      const actions = document.querySelector('.received-actions');
      if (actions && !document.getElementById('received-portal')) {
        const portal = document.createElement('a');
        portal.id = 'received-portal';
        portal.href = portalUrl;
        portal.className = 'btn btn-secondary';
        portal.textContent = 'Track your project';
        actions.insertBefore(portal, actions.firstChild?.nextSibling || null);
      }
    }
    note.textContent = text;
  }
})();