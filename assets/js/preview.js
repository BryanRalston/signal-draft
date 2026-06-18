(function () {
  const params = new URLSearchParams(window.location.search);
  const caseId = params.get('case') || 'csat';
  const isSample = params.get('sample') === '1' || !sessionStorage.getItem('sd_submitted_brief');
  const tpl = window.SD_TEMPLATES[caseId] || window.SD_TEMPLATES.csat;

  const companyName = isSample
    ? (tpl.sampleCompany || 'Sample Company')
    : (() => {
        try {
          const raw = sessionStorage.getItem('sd_submitted_brief');
          if (raw) return JSON.parse(raw).companyName || tpl.sampleCompany;
        } catch (_) { /* */ }
        return tpl.sampleCompany || 'Sample Company';
      })();

  const complianceEl = document.getElementById('compliance-bar');
  const dossierEl = document.getElementById('dossier-content');
  const surveyEl = document.getElementById('survey-content');
  const metaEl = document.getElementById('preview-meta');
  const bannerEl = document.getElementById('sample-banner');

  if (bannerEl && isSample) {
    bannerEl.hidden = false;
    bannerEl.innerHTML = '<strong>Sample deliverable.</strong> This shows the structure and methodology for this use case — not a live output from your brief. After you submit, we research your context and deliver a custom instrument within 48 hours.';
  }

  if (metaEl) {
    const sampleTag = isSample ? ' · <span style="color:var(--brass)">Sample</span>' : '';
    metaEl.innerHTML = `
      <strong>${companyName}</strong> · ${tpl.label} ·
      ${tpl.questionCount} questions · ~${tpl.estMinutes} min${sampleTag} ·
      <span style="color:var(--brass)">Human-reviewed before delivery</span>
    `;
  }

  if (complianceEl) {
    complianceEl.innerHTML = tpl.compliance.map((c) => `
      <div class="compliance-item ${c.status}">
        <span class="dot"></span>
        ${c.label}
      </div>
    `).join('');
  }

  if (dossierEl) {
    const d = tpl.dossier;
    const sections = ['company', 'competitors', 'market', 'objectives'];
    dossierEl.innerHTML = sections.map((key) => {
      const s = d[key];
      if (!s) return '';
      const items = s.items ? `<ul>${s.items.map((i) => `<li>${i}</li>`).join('')}</ul>` : '';
      const cites = s.cites ? `<p class="cite">Sources: ${s.cites.join(' · ')}</p>` : '';
      return `<div class="dossier-section">
        <h3>${s.title}</h3>
        <div class="dossier-block"><p>${s.body}</p>${items}${cites}</div>
      </div>`;
    }).join('');
  }

  if (surveyEl) {
    surveyEl.innerHTML = `<ol class="question-list">${tpl.questions.map((q) => `
      <li class="question-card">
        <div class="method-rail" aria-hidden="true"></div>
        <div class="question-body">
          <div class="question-num">Q${q.n}</div>
          <p class="question-text">${q.text}</p>
          <div class="question-meta">
            <span class="meta-tag">${q.type}</span>
            ${q.objective !== '—' ? `<span class="meta-tag obj">${q.objective}</span>` : ''}
            <span class="meta-tag">${q.note}</span>
          </div>
        </div>
      </li>
    `).join('')}</ol>`;
  }

  document.querySelectorAll('.preview-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const pane = tab.dataset.pane;
      document.querySelectorAll('.preview-tab').forEach((t) => {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', t === tab);
      });
      document.querySelectorAll('.preview-pane').forEach((p) => {
        p.classList.toggle('active', p.id === `pane-${pane}`);
      });
    });
  });

  const email = window.SD_CONFIG.contactEmail;
  const mailLink = document.getElementById('mailto-cta');
  if (mailLink) {
    const subject = isSample
      ? `SignalDraft — ${tpl.label} project inquiry`
      : `SignalDraft — ${companyName} survey review`;
    const body = isSample
      ? 'I reviewed the sample deliverable and would like to discuss a project.'
      : 'I reviewed my survey preview and would like to proceed.';
    mailLink.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
})();