(function () {
  const cfg = window.SD_CONFIG;
  const STEPS = [
    { id: 'usecase', title: 'Survey type', hint: 'Choose the primary purpose. We tailor research and question design to match.' },
    { id: 'company', title: 'Company context', hint: 'We research your business from public sources to ground the survey in reality.' },
    { id: 'objectives', title: 'What you need to learn', hint: 'Be specific about decisions this survey will inform. This drives every question.' },
    { id: 'audience', title: 'Who will respond', hint: 'Audience definition affects question language, length, and screening.' },
    { id: 'decisions', title: 'Decision rules', hint: 'What thresholds or outcomes will you act on? We design toward these.' },
    { id: 'contact', title: 'Your details', hint: 'We will review your brief and respond within 48 hours.' },
  ];

  const defaultData = () => ({
    useCase: '',
    companyName: '',
    companyUrl: '',
    industry: '',
    description: '',
    businessObjective: '',
    researchObjectives: '',
    hypotheses: '',
    audience: '',
    sampleSize: '',
    incidence: '',
    decisionRules: '',
    deliverables: ['blueprint'],
    contactName: '',
    contactEmail: '',
    contactCompany: '',
    notes: '',
  });

  let step = 0;
  let data = defaultData();

  const progressEl = document.getElementById('wizard-progress');
  const labelEl = document.getElementById('wizard-step-label');
  const panelEl = document.getElementById('wizard-panel');
  const btnBack = document.getElementById('btn-back');
  const btnNext = document.getElementById('btn-next');
  const saveHint = document.getElementById('save-hint');

  function load() {
    try {
      const raw = localStorage.getItem(cfg.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        data = { ...defaultData(), ...parsed.data };
        step = parsed.step || 0;
      }
    } catch (_) { /* ignore */ }
  }

  function save() {
    localStorage.setItem(cfg.storageKey, JSON.stringify({ step, data, savedAt: Date.now() }));
    if (saveHint) {
      saveHint.textContent = 'Draft saved';
      setTimeout(() => { saveHint.textContent = 'Saves automatically'; }, 2000);
    }
  }

  function renderProgress() {
    if (!progressEl) return;
    progressEl.innerHTML = STEPS.map((_, i) => {
      let cls = 'seg';
      if (i < step) cls += ' done';
      if (i === step) cls += ' active';
      return `<div class="${cls}" aria-hidden="true"></div>`;
    }).join('');
    if (labelEl) labelEl.textContent = `Step ${step + 1} of ${STEPS.length} — ${STEPS[step].title}`;
  }

  function chipGroup(name, options, multi) {
    const selected = multi ? (data[name] || []) : [data[name]];
    return `<div class="chip-group" data-field="${name}" data-multi="${multi ? '1' : '0'}">
      ${options.map((o) => {
        const val = typeof o === 'string' ? o : o.id;
        const lab = typeof o === 'string' ? o : o.label;
        const on = multi ? selected.includes(val) : data[name] === val;
        return `<button type="button" class="chip${on ? ' selected' : ''}" data-value="${val}">${lab}</button>`;
      }).join('')}
    </div>`;
  }

  function field(name, label, type, opts) {
    const val = data[name] ?? '';
    const help = opts?.help ? `<p class="help">${opts.help}</p>` : '';
    if (type === 'textarea') {
      return `<div class="form-group"><label for="${name}">${label}</label>
        <textarea id="${name}" name="${name}" rows="${opts?.rows || 4}" placeholder="${opts?.placeholder || ''}">${val}</textarea>${help}</div>`;
    }
    return `<div class="form-group"><label for="${name}">${label}</label>
      <input type="${type}" id="${name}" name="${name}" value="${val}" placeholder="${opts?.placeholder || ''}" ${opts?.required ? 'required' : ''}>${help}</div>`;
  }

  function renderStep() {
    const s = STEPS[step];
    let html = `<h2>${s.title}</h2><p class="hint">${s.hint}</p>`;

    switch (s.id) {
      case 'usecase':
        html += chipGroup('useCase', window.SD_USE_CASES.map((u) => ({ id: u.id, label: u.label })), false);
        html += '<div style="margin-top:1rem">';
        window.SD_USE_CASES.forEach((u) => {
          html += `<p style="font-size:0.8125rem;color:var(--parchment-dim);margin:0.25rem 0" data-uc-desc="${u.id}"><strong>${u.label}:</strong> ${u.desc}</p>`;
        });
        html += '</div>';
        break;
      case 'company':
        html += field('companyName', 'Company name', 'text', { required: true, placeholder: 'Acme Analytics' });
        html += field('companyUrl', 'Company website', 'url', { placeholder: 'https://' });
        html += field('industry', 'Industry', 'text', { placeholder: 'B2B SaaS, healthcare, retail…' });
        html += field('description', 'What does your company do?', 'textarea', { rows: 3, placeholder: 'One paragraph on products, customers, and positioning.' });
        break;
      case 'objectives':
        html += field('businessObjective', 'Business problem to solve', 'textarea', { rows: 3, placeholder: 'e.g. Churn increased 12% last quarter. We need to understand why before renewal season.' });
        html += field('researchObjectives', 'Specific questions you need answered', 'textarea', { rows: 4, placeholder: 'List 3–5 concrete questions. e.g. What drives NPS? Which features correlate with retention?' });
        html += field('hypotheses', 'Competitors you want benchmarked (optional)', 'textarea', { rows: 2, placeholder: 'Name 2–4 competitors or alternatives your customers consider.' });
        break;
      case 'audience':
        html += field('audience', 'Who will take this survey?', 'textarea', { rows: 3, placeholder: 'e.g. Current customers, US-based, used product 90+ days, decision-maker or daily user.' });
        html += field('sampleSize', 'Target responses (optional)', 'number', { placeholder: '400', help: 'Rule of thumb: 400 completes ≈ ±5% margin of error.' });
        html += field('incidence', 'How hard is this audience to reach?', 'text', { placeholder: 'e.g. General B2B buyers vs. pediatricians', help: 'Niche audiences cost more to recruit and may need shorter surveys.' });
        break;
      case 'decisions':
        html += field('decisionRules', 'What actions will you take based on results?', 'textarea', { rows: 3, placeholder: 'e.g. If NPS < 30, redesign onboarding. If support satisfaction < 3.5, hire 2 CSMs.' });
        html += '<div class="form-group"><label>Deliverables needed</label>';
        html += chipGroup('deliverables', [
          { id: 'blueprint', label: 'Survey blueprint (questions + rationale)' },
          { id: 'dossier', label: 'Research dossier (company + market context)' },
          { id: 'export', label: 'Export-ready file (Typeform/SurveyMonkey)' },
          { id: 'review', label: 'Live review call' },
        ], true);
        html += '</div>';
        break;
      case 'contact':
        html += field('contactName', 'Your name', 'text', { required: true });
        html += field('contactEmail', 'Email', 'email', { required: true });
        html += field('contactCompany', 'Company', 'text');
        html += field('notes', 'Anything else?', 'textarea', { rows: 2 });
        html += `<div class="honeypot" aria-hidden="true"><input type="text" name="_gotcha" tabindex="-1" autocomplete="off"></div>`;
        html += `<p class="help" style="margin-top:1rem">By submitting, you agree to our <a href="../privacy.html">Privacy Policy</a>. AI-assisted draft — human-reviewed before delivery.</p>`;
        break;
    }

    panelEl.innerHTML = html;
    bindPanel();
    renderProgress();
    btnBack.style.visibility = step === 0 ? 'hidden' : 'visible';
    btnNext.textContent = step === STEPS.length - 1 ? 'Generate survey preview' : 'Continue';
  }

  function bindPanel() {
    panelEl.querySelectorAll('.chip-group').forEach((group) => {
      const fieldName = group.dataset.field;
      const multi = group.dataset.multi === '1';
      group.querySelectorAll('.chip').forEach((chip) => {
        chip.addEventListener('click', () => {
          const val = chip.dataset.value;
          if (multi) {
            const arr = Array.isArray(data[fieldName]) ? [...data[fieldName]] : [];
            const idx = arr.indexOf(val);
            if (idx >= 0) arr.splice(idx, 1);
            else arr.push(val);
            data[fieldName] = arr;
          } else {
            data[fieldName] = val;
          }
          save();
          renderStep();
        });
      });
    });

    panelEl.querySelectorAll('input:not([name="_gotcha"]), textarea').forEach((el) => {
      el.addEventListener('input', () => {
        data[el.name] = el.value;
        save();
      });
      el.addEventListener('change', () => {
        data[el.name] = el.value;
        save();
      });
    });
  }

  function validate() {
    if (step === 0 && !data.useCase) {
      alert('Please select a survey type.');
      return false;
    }
    if (step === 1 && !data.companyName.trim()) {
      alert('Please enter your company name.');
      return false;
    }
    if (step === 2 && !data.researchObjectives.trim()) {
      alert('Please describe what you need to learn.');
      return false;
    }
    if (step === STEPS.length - 1) {
      if (!data.contactName.trim() || !data.contactEmail.trim()) {
        alert('Please enter your name and email.');
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
        alert('Please enter a valid email.');
        return false;
      }
    }
    return true;
  }

  async function submitBrief() {
    save();
    const payload = { ...data, submittedAt: new Date().toISOString() };

    try {
      const formData = new FormData();
      formData.append('_subject', `SignalDraft brief: ${data.companyName || 'New'}`);
      formData.append('_template', 'table');
      formData.append('_captcha', 'false');
      Object.entries(payload).forEach(([k, v]) => {
        formData.append(k, Array.isArray(v) ? v.join(', ') : String(v ?? ''));
      });

      await fetch(cfg.formSubmitUrl, { method: 'POST', body: formData, mode: 'no-cors' });
    } catch (_) { /* local/demo ok */ }

    sessionStorage.setItem('sd_submitted', '1');
    window.location.href = `generating.html?case=${encodeURIComponent(data.useCase || 'csat')}`;
  }

  btnBack?.addEventListener('click', () => {
    if (step > 0) { step--; save(); renderStep(); }
  });

  btnNext?.addEventListener('click', () => {
    if (!validate()) return;
    if (step < STEPS.length - 1) {
      step++;
      save();
      renderStep();
    } else {
      submitBrief();
    }
  });

  load();
  renderStep();
})();