const { getSupabase } = require('../../lib/supabase');
const { setCors, handleOptions } = require('../../lib/cors');
const { requireAdmin } = require('../../lib/auth');
const { DEFAULT_GROWTH_STATE, cloneState } = require('../../lib/growth');

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

async function loadGrowthState(supabase) {
  const { data, error } = await supabase
    .from('growth_state')
    .select('state_json, updated_at')
    .eq('id', 'signal-draft')
    .maybeSingle();
  if (error) throw error;
  return data?.state_json || DEFAULT_GROWTH_STATE;
}

async function saveGrowthState(supabase, state) {
  const { data, error } = await supabase
    .from('growth_state')
    .upsert({
      id: 'signal-draft',
      state_json: state,
      updated_at: new Date().toISOString(),
    })
    .select('state_json, updated_at')
    .single();
  if (error) throw error;
  return data;
}

module.exports = async (req, res) => {
  setCors(req, res);
  if (handleOptions(req, res)) return;
  if (!requireAdmin(req, res)) return;

  try {
    const supabase = getSupabase();

    if (req.method === 'GET') {
      const state = await loadGrowthState(supabase);
      res.status(200).json({ success: true, growth: state });
      return;
    }

    if (req.method === 'PATCH') {
      const body = await readBody(req);
      const current = cloneState(await loadGrowthState(supabase));
      const patch = body.growth || body;

      if (patch.phase) current.phase = patch.phase;
      if (patch.blockers) current.blockers = patch.blockers;
      if (patch.phase_gates) current.phase_gates = { ...current.phase_gates, ...patch.phase_gates };
      if (patch.recommendations_log) current.recommendations_log = patch.recommendations_log;
      if (patch.metrics) current.metrics = { ...current.metrics, ...patch.metrics };

      if (body.recommendation) {
        const entry = {
          id: `rec-${Date.now()}`,
          at: new Date().toISOString(),
          recommendation: body.recommendation,
          status: body.status || 'open',
        };
        current.recommendations_log = [...(current.recommendations_log || []), entry];
      }

      if (body.dismiss_recommendation_id) {
        current.recommendations_log = (current.recommendations_log || []).map((r) =>
          r.id === body.dismiss_recommendation_id ? { ...r, status: 'done' } : r
        );
      }

      current.last_assessed_at = new Date().toISOString();
      const saved = await saveGrowthState(supabase, current);
      res.status(200).json({ success: true, growth: saved.state_json, updated_at: saved.updated_at });
      return;
    }

    res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (e) {
    console.error('Growth API error:', e);
    res.status(500).json({ success: false, message: e.message || 'Growth state error' });
  }
};