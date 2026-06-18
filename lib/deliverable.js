const { USE_CASE_LABELS } = require('./prompt');

function validateDeliverable(raw) {
  const errors = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, errors: ['Deliverable must be a JSON object'] };
  }

  if (!raw.companyName || typeof raw.companyName !== 'string') {
    errors.push('companyName is required');
  }
  if (!raw.label || typeof raw.label !== 'string') {
    errors.push('label is required');
  }
  if (!raw.dossier || typeof raw.dossier !== 'object') {
    errors.push('dossier must be an object');
  }
  if (!Array.isArray(raw.questions) || raw.questions.length < 1) {
    errors.push('questions must be a non-empty array');
  } else {
    raw.questions.forEach((q, i) => {
      if (!q || typeof q.text !== 'string' || !q.text.trim()) {
        errors.push(`questions[${i}].text is required`);
      }
    });
  }
  if (raw.compliance !== undefined && !Array.isArray(raw.compliance)) {
    errors.push('compliance must be an array when provided');
  }

  return { valid: errors.length === 0, errors };
}

function normalizeDeliverable(raw, project) {
  const d = { ...raw };
  d.version = d.version || 1;
  if (!d.companyName && project?.company_name) d.companyName = project.company_name;
  if (!d.useCase && project?.use_case) d.useCase = project.use_case;
  if (!d.label && d.useCase) d.label = USE_CASE_LABELS[d.useCase] || d.useCase;
  if (!d.questionCount && Array.isArray(d.questions)) d.questionCount = d.questions.length;
  if (!d.estMinutes) d.estMinutes = Math.min(6, Math.max(3, Math.ceil((d.questions?.length || 12) * 0.35)));
  if (!Array.isArray(d.compliance)) d.compliance = [];
  if (!d.dossier || typeof d.dossier !== 'object') d.dossier = {};
  return d;
}

module.exports = { validateDeliverable, normalizeDeliverable };