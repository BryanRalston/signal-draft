(function () {
  const params = new URLSearchParams(window.location.search);
  const useCase = params.get('case') || 'csat';
  const company = (() => {
    try {
      const raw = localStorage.getItem(window.SD_CONFIG.storageKey);
      if (raw) return JSON.parse(raw).data?.companyName || 'your company';
    } catch (_) { /* */ }
    return 'your company';
  })();

  const phases = [
    { title: 'Analyzing company context', desc: `Reviewing ${company} — positioning, products, public messaging` },
    { title: 'Scanning competitive landscape', desc: 'Identifying competitors, alternatives, and positioning gaps' },
    { title: 'Gathering market intelligence', desc: 'Industry trends, benchmarks, and decision drivers' },
    { title: 'Mapping research objectives', desc: 'Linking your brief to measurable survey goals' },
    { title: 'Designing survey instrument', desc: 'Question types, scales, bias controls, optimal length' },
    { title: 'Running methodology review', desc: 'Compliance check — objectives, scales, GDPR, anonymity' },
  ];

  const listEl = document.getElementById('gen-phases');
  const barEl = document.getElementById('gen-bar-fill');
  const statusEl = document.getElementById('gen-status');

  if (listEl) {
    listEl.innerHTML = phases.map((p, i) => `
      <div class="gen-phase" data-phase="${i}">
        <div class="icon">${i + 1}</div>
        <div>
          <h4>${p.title}</h4>
          <p>${p.desc}</p>
        </div>
      </div>
    `).join('');
  }

  const phaseEls = () => document.querySelectorAll('.gen-phase');
  let current = 0;
  const stepMs = 1100;

  function tick() {
    const els = phaseEls();
    els.forEach((el, i) => {
      el.classList.remove('active', 'done');
      if (i < current) el.classList.add('done');
      if (i === current) el.classList.add('active');
    });
    const pct = ((current + 1) / phases.length) * 100;
    if (barEl) barEl.style.width = `${pct}%`;
    if (statusEl) statusEl.textContent = phases[current]?.title || 'Complete';

    if (current < phases.length - 1) {
      current++;
      setTimeout(tick, stepMs);
    } else {
      setTimeout(() => {
        window.location.href = `preview.html?case=${encodeURIComponent(useCase)}`;
      }, 900);
    }
  }

  setTimeout(tick, 400);
})();