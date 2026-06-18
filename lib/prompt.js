const USE_CASE_LABELS = {
  csat: 'Customer satisfaction',
  employee: 'Employee engagement',
  competitive: 'Competitive positioning',
};

function inferTier(intake) {
  const d = intake.deliverables;
  const list = Array.isArray(d) ? d : String(d || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (list.includes('export') || list.includes('review')) return 'full';
  if (list.some((x) => String(x).toLowerCase().includes('research'))) return 'research';
  return 'blueprint';
}

function formatDeliverables(intake) {
  const d = intake.deliverables;
  if (Array.isArray(d)) return d.join(', ');
  return d || 'blueprint';
}

function buildGrokPrompt(project) {
  const intake = project.intake_json || {};
  const useCase = project.use_case || intake.useCase || 'csat';
  const label = USE_CASE_LABELS[useCase] || useCase;

  return `You are a survey research designer for SignalDraft.

CLIENT BRIEF
============
Company: ${project.company_name || intake.companyName || '—'}
Website: ${intake.companyUrl || '—'}
Industry: ${intake.industry || '—'}
Survey type: ${label} (${useCase})
Tier: ${project.tier || inferTier(intake)}

What they do:
${intake.description || '—'}

Business problem:
${intake.businessObjective || '—'}

Research questions to answer:
${intake.researchObjectives || '—'}

Competitors to benchmark:
${intake.hypotheses || '—'}

Audience:
${intake.audience || '—'}
Sample size target: ${intake.sampleSize || 'not specified'}
Incidence / reach: ${intake.incidence || '—'}

Decision rules (what they will act on):
${intake.decisionRules || '—'}

Deliverables requested: ${formatDeliverables(intake)}
Client notes: ${intake.notes || '—'}

Contact: ${project.contact_name} <${project.contact_email}>

TASK
====
1. Research this company, competitors, and market using web search. Cite real sources only — verify before citing.
2. Produce a RESEARCH DOSSIER with sections: Company, Competitors, Market, Objectives mapped.
3. Design a survey instrument: each question maps to a research objective (RO1, RO2…). Per question include: text, type, objective, methodology note (bias control, scale rationale).
4. Run methodology compliance check (objectives mapped, validated scales, GDPR consent, anonymity if employee survey).

METHODOLOGY RULES (non-negotiable)
==================================
- Pin pricing questions to a stated volume tier if asking willingness-to-pay.
- Market-size figures are directional only — cite ranges, not false precision.
- Verify every factual claim with a fetched source; no fabricated stats.
- Benchmark perceptual comparisons against the dominant incumbent, not every competitor.
- Target ≤6 min completion; cut open-ends before adding questions.
- Flag thin public footprint early if company is stealth/pre-launch.

OUTPUT
======
Structured sections ready for client delivery (dossier + numbered questions + compliance summary).`;
}

module.exports = { buildGrokPrompt, inferTier, USE_CASE_LABELS };