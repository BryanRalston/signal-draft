const { getSupabase } = require('../../lib/supabase');
const { setCors, handleOptions } = require('../../lib/cors');
const { requireAdmin } = require('../../lib/auth');
const { safeSend, sendStatusChanged } = require('../../lib/email');

const VALID_STATUS = new Set([
  'received', 'researching', 'drafting', 'review', 'delivered', 'revision', 'closed',
]);

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

module.exports = async (req, res) => {
  setCors(req, res);
  if (handleOptions(req, res)) return;
  if (!requireAdmin(req, res)) return;

  const supabase = getSupabase();

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, client_token, status, tier, due_at, company_name, contact_name, contact_email, use_case, created_at, updated_at, delivered_at, operator_notes, payment_status, portal_visible, deliverable_published_at')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      res.status(200).json({ success: true, projects: data });
    } catch (e) {
      console.error('Projects list error:', e);
      res.status(500).json({ success: false, message: 'Could not load projects' });
    }
    return;
  }

  if (req.method === 'PATCH') {
    try {
      const body = await readBody(req);
      const { id, status, operator_notes: operatorNotes } = body;

      if (!id) {
        res.status(400).json({ success: false, message: 'Missing project id' });
        return;
      }

      const { data: existing, error: fetchErr } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchErr || !existing) {
        res.status(404).json({ success: false, message: 'Project not found' });
        return;
      }

      const patch = {};
      if (status !== undefined) {
        if (!VALID_STATUS.has(status)) {
          res.status(400).json({ success: false, message: 'Invalid status' });
          return;
        }
        patch.status = status;
        if (status === 'delivered') patch.delivered_at = new Date().toISOString();
      }
      if (operatorNotes !== undefined) patch.operator_notes = operatorNotes;

      if (!Object.keys(patch).length) {
        res.status(400).json({ success: false, message: 'Nothing to update' });
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .update(patch)
        .eq('id', id)
        .select('id, status, delivered_at, operator_notes, updated_at, contact_email, contact_name, company_name, client_token')
        .single();

      if (error) throw error;

      if (status !== undefined && status !== existing.status) {
        await safeSend(sendStatusChanged, existing, existing.status, status);
      }

      res.status(200).json({ success: true, project: data });
    } catch (e) {
      console.error('Projects patch error:', e);
      res.status(500).json({ success: false, message: 'Could not update project' });
    }
    return;
  }

  res.status(405).json({ success: false, message: 'Method not allowed' });
};