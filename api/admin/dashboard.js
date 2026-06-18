const { getSupabase } = require('../../lib/supabase');
const { setCors, handleOptions } = require('../../lib/cors');
const { requireAdmin } = require('../../lib/auth');
const { DEFAULT_GROWTH_STATE, dashboardSummary } = require('../../lib/growth');
const { runPulse } = require('../../lib/pulse');

async function loadGrowthState(supabase) {
  const { data, error } = await supabase
    .from('growth_state')
    .select('state_json')
    .eq('id', 'signal-draft')
    .maybeSingle();
  if (error) throw error;

  const raw = data?.state_json;
  const empty = !raw || (typeof raw === 'object' && Object.keys(raw).length === 0);
  if (!empty) return raw;

  await supabase.from('growth_state').upsert({
    id: 'signal-draft',
    state_json: DEFAULT_GROWTH_STATE,
    updated_at: new Date().toISOString(),
  });
  return DEFAULT_GROWTH_STATE;
}

async function loadProjects(supabase) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, client_token, status, tier, due_at, company_name, contact_name, contact_email, use_case, created_at, updated_at, delivered_at, operator_notes, payment_status, portal_visible, deliverable_published_at')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data || [];
}

module.exports = async (req, res) => {
  setCors(req, res);
  if (handleOptions(req, res)) return;
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }
  if (!requireAdmin(req, res)) return;

  try {
    const pulse = await runPulse();
    let projects = [];
    let growth = DEFAULT_GROWTH_STATE;
    let dbOk = false;

    try {
      const supabase = getSupabase();
      dbOk = true;
      [projects, growth] = await Promise.all([loadProjects(supabase), loadGrowthState(supabase)]);
    } catch (e) {
      console.warn('Dashboard DB partial:', e.message);
    }

    const dashboard = dashboardSummary(projects, growth, pulse, { supabaseOk: dbOk });

    res.status(200).json({
      success: true,
      projects,
      ...dashboard,
      db_connected: dbOk,
    });
  } catch (e) {
    console.error('Dashboard error:', e);
    res.status(500).json({ success: false, message: 'Could not load dashboard' });
  }
};