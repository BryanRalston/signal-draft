/** Canonical Growth Operator state — seeded to Supabase + static fallback */
const DEFAULT_GROWTH_STATE = {
  version: 1,
  project_id: 'signal-draft',
  phase: '1-activation',
  north_star: 'First paying founding client delivered within 48h SLA',
  last_assessed_at: null,
  last_pulse: null,
  metrics: {
    founding_slots_total: 10,
    founding_slots_remaining: 10,
    clients_total: 0,
    clients_delivered: 0,
    clients_in_pipeline: {
      received: 0,
      researching: 0,
      drafting: 0,
      review: 0,
      revision: 0,
    },
    sla_overdue_count: 0,
    marketing_live: true,
    api_live: false,
    supabase_activated: false,
    vercel_deployed: false,
  },
  blockers: [
    {
      id: 'infra-supabase',
      severity: 'critical',
      title: 'Supabase project not activated',
      resolution_steps: [
        'Create project at https://supabase.com',
        'Run supabase/schema.sql in SQL Editor',
        'Copy Project URL + service_role key to Vercel env',
      ],
    },
    {
      id: 'infra-vercel',
      severity: 'critical',
      title: 'Vercel deploy + env vars not configured',
      resolution_steps: [
        'Import BryanRalston/signal-draft at vercel.com (Framework: Other)',
        'Add SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_PASSWORD per .env.example',
        'Deploy and verify /command/ and POST /api/intake',
      ],
    },
    {
      id: 'config-apibase',
      severity: 'high',
      title: 'apiBase empty — GH Pages cannot reach Vercel API',
      resolution_steps: [
        'After Vercel deploy, set apiBase in assets/js/config.js to Vercel URL',
        'Or point custom domain to Vercel with apiBase: ""',
      ],
    },
  ],
  phase_gates: {
    phase_1_activation: {
      label: 'Phase 1 — Activation (code shipped, infra live)',
      items: [
        { id: 'code-shipped', title: 'Phase 1 code in repo (intake, command, portal, schema)', status: 'done' },
        { id: 'supabase-live', title: 'Supabase project + schema.sql applied', status: 'pending' },
        { id: 'vercel-live', title: 'Vercel deploy with env vars', status: 'pending' },
        { id: 'intake-test', title: 'Test POST /api/intake → row in projects table', status: 'pending' },
        { id: 'command-access', title: 'Operator can log in at /command/ and see dashboard', status: 'pending' },
      ],
    },
    phase_1_ops: {
      label: 'Phase 1 — Operations (first revenue)',
      items: [
        { id: 'first-brief', title: 'First founding client brief received via live intake', status: 'pending' },
        { id: 'first-delivery', title: 'First deliverable completed within 48h SLA', status: 'pending' },
        { id: 'portal-link', title: 'Client receives portal token link', status: 'pending' },
        { id: 'founding-track', title: 'Founding slots tracked (10 total)', status: 'pending' },
      ],
    },
    phase_2: {
      label: 'Phase 2 — Productize',
      items: [
        { id: 'portal-deliverable', title: 'Publish deliverable JSON from command → portal', status: 'pending' },
        { id: 'resend-emails', title: 'Resend branded emails on status change', status: 'pending' },
        { id: 'stripe', title: 'Stripe payment link on intake', status: 'pending' },
      ],
    },
  },
  recommendations_log: [
    {
      id: 'rec-initial',
      at: '2026-06-18T00:00:00.000Z',
      recommendation: 'Activate Supabase + Vercel per SCALE.md — create Supabase project, run schema.sql, deploy to Vercel with env vars, then set apiBase if keeping GitHub Pages for marketing.',
      status: 'open',
    },
  ],
};

module.exports = { DEFAULT_GROWTH_STATE };