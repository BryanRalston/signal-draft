/** Shared renderer for preview + portal deliverables */
window.SD_renderDeliverable = function renderDeliverable(tpl, opts) {
  const companyName = opts?.companyName || tpl.companyName || 'Your company';
  const complianceEl = document.getElementById('compliance-bar');
  const dossierEl = document.getElementById('dossier-content');
  const surveyEl = document.getElementById('survey-content');
  const metaEl = document.getElementById('preview-meta');

  if (metaEl) {
    metaEl.innerHTML = `
      <strong>${companyName}</strong> · ${tpl.label || ''} ·
      ${tpl.questionCount || tpl.questions?.length || 0} questions · ~${tpl.estMinutes || 5} min ·
      <span style="color:var(--brass)">Human-reviewed before delivery</span>
    `;
  }

  if (complianceEl && Array.isArray(tpl.compliance)) {
    complianceEl.innerHTML = tpl.compliance.map((c) => `
      <div class="compliance-item ${c.status || 'pass'}">
        <span class="dot"></span>
        ${c.label}
      </div>
    `).join('');
  }

  if (dossierEl && tpl.dossier) {
    const sections = ['company', 'competitors', 'market', 'objectives'];
    dossierEl.innerHTML = sections.map((key) => {
      const s = tpl.dossier[key];
      if (!s) return '';
      const items = s.items ? `<ul>${s.items.map((i) => `<li>${i}</li>`).join('')}</ul>` : '';
      const cites = s.cites ? `<p class="cite">Sources: ${s.cites.join(' · ')}</p>` : '';
      return `<div class="dossier-section">
        <h3>${s.title || key}</h3>
        <div class="dossier-block"><p>${s.body || ''}</p>${items}${cites}</div>
      </div>`;
    }).join('');
  }

  if (surveyEl && Array.isArray(tpl.questions)) {
    surveyEl.innerHTML = `<ol class="question-list">${tpl.questions.map((q, i) => `
      <li class="question-card">
        <div class="method-rail" aria-hidden="true"></div>
        <div class="question-body">
          <div class="question-num">Q${q.n || i + 1}</div>
          <p class="question-text">${q.text}</p>
          <div class="question-meta">
            <span class="meta-tag">${q.type || 'Question'}</span>
            ${q.objective && q.objective !== '—' ? `<span class="meta-tag obj">${q.objective}</span>` : ''}
            ${q.note ? `<span class="meta-tag">${q.note}</span>` : ''}
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
};