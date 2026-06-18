const { getSupabase } = require('../../lib/supabase');
const { setCors, handleOptions } = require('../../lib/cors');
const { requireAdmin } = require('../../lib/auth');
const { buildGrokPrompt } = require('../../lib/prompt');

module.exports = async (req, res) => {
  setCors(req, res);
  if (handleOptions(req, res)) return;
  if (!requireAdmin(req, res)) return;

  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  const id = (req.query.id || '').trim();
  if (!id) {
    res.status(400).json({ success: false, message: 'Missing id' });
    return;
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    const includePrompt = req.query.prompt === '1';
    const payload = { success: true, project: data };
    if (includePrompt) payload.grokPrompt = buildGrokPrompt(data);

    res.status(200).json(payload);
  } catch (e) {
    console.error('Project detail error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};