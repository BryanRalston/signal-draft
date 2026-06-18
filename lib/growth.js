const { DEFAULT_GROWTH_STATE } = require('./growth-defaults');

const ACTIVE_STATUSES = new Set(['received', 'researching', 'drafting', 'review', 'revision']);
const PIPELINE_KEYS = ['received', 'researching', 'drafting', 'review', 'revision'];

function cloneState(state) {
  return JSON.parse(JSON.stringify(state || DEFAULT_GROWTH_STATE));
}

function computeProjectMetrics(projects, turnaroundHours = 48) {
  const now = Date.now();
  const pipeline = { received: 0, researching: 0, drafting: 0, review: 0, revision: 0 };
  let overdue = 0;
  let delivered = 0;

  for (const p of projects || []) {
    if (p.status === 'delivered' || p.status === 'closed') {
      if (p.status === 'delivered') delivered += 1;
      continue;
    }
    if (PIPELINE_KEYS.includes(p.status)) pipeline[p.status] += 1;
    if (ACTIVE_STATUSES.has(p.status) && p.due_at && new Date(p.due_at).getTime() < now) {
      overdue += 1;
    }
  }

  const foundingTotal = Number(process.env.FOUNDING_SLOTS) || 10;
  const activeCount = projects?.filter((p) => p.status !== 'closed').length || 0;
  const foundingRemaining = Math.max(0, foundingTotal - activeCount);

  return {
    founding_slots_total: foundingTotal,
    founding_slots_remaining: foundingRemaining,
    clients_total: projects?.length || 0,
    clients_delivered: delivered,
    clients_in_pipeline: pipeline,
    sla_overdue_count: overdue,
    turnaround_hours: turnaroundHours,
  };
}

function mergeProjectsIntoGrowth(growth, projects, opts = {}) {
  const state = cloneState(growth);
  const metrics = computeProjectMetrics(projects, opts.turnaroundHours);
  state.metrics = { ...state.metrics, ...metrics };
  if (opts.pulse) {
    state.last_pulse = opts.pulse;
    state.metrics.marketing_live = opts.pulse.summary?.marketing_live ?? state.metrics.marketing_live;
    state.metrics.api_live = opts.pulse.summary?.vercel_live ?? state.metrics.api_live;
    state.metrics.vercel_deployed = opts.pulse.summary?.vercel_live ?? false;
    state.metrics.supabase_activated = opts.supabaseOk ?? false;
  }
  state.last_assessed_at = new Date().toISOString();
  return state;
}

function topRecommendation(state) {
  const open = (state.recommendations_log || []).filter((r) => r.status === 'open');
  if (open.length) return open[open.length - 1];
  if (state.metrics?.sla_overdue_count > 0) {
    return {
      recommendation: `Address ${state.metrics.sla_overdue_count} overdue project(s) — communicate with clients or prioritize delivery.`,
      status: 'open',
      at: new Date().toISOString(),
    };
  }
  const critical = (state.blockers || []).find((b) => b.severity === 'critical');
  if (critical) {
    return {
      recommendation: critical.resolution_steps?.[0] || critical.title,
      status: 'open',
      at: new Date().toISOString(),
    };
  }
  return null;
}

function dashboardSummary(projects, growth, pulse, extras = {}) {
  const state = mergeProjectsIntoGrowth(growth, projects, {
    pulse,
    turnaroundHours: Number(process.env.TURNAROUND_HOURS) || 48,
    supabaseOk: extras.supabaseOk,
  });
  const active = (projects || []).filter((p) => ACTIVE_STATUSES.has(p.status));
  const overdue = (projects || []).filter(
    (p) => ACTIVE_STATUSES.has(p.status) && p.due_at && new Date(p.due_at) < new Date()
  );
  const recent = [...(projects || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8);

  return {
    growth: state,
    recommendation: topRecommendation(state),
    counts: {
      active: active.length,
      overdue: overdue.length,
      total: projects?.length || 0,
      delivered: state.metrics.clients_delivered,
      founding_remaining: state.metrics.founding_slots_remaining,
    },
    overdue_projects: overdue.map((p) => ({
      id: p.id,
      company_name: p.company_name,
      contact_name: p.contact_name,
      status: p.status,
      due_at: p.due_at,
      hours_over: Math.round((Date.now() - new Date(p.due_at).getTime()) / 3600000),
    })),
    recent_projects: recent,
    pulse: pulse || state.last_pulse,
    infra_ready: Boolean(pulse?.summary?.vercel_live && (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)),
  };
}

module.exports = {
  DEFAULT_GROWTH_STATE,
  cloneState,
  computeProjectMetrics,
  mergeProjectsIntoGrowth,
  topRecommendation,
  dashboardSummary,
};