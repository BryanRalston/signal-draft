const { getSupabase } = require('../../lib/supabase');
const { setCors, handleOptions } = require('../../lib/cors');
const { requireAdmin } = require('../../lib/auth');
const { buildGrokPrompt } = require('../../lib/prompt');
const { validateDeliverable, normalizeDeliverable } = require('../../lib/deliverable');
const { safeSend, sendDeliverableReady } = require('../../lib/email');

const VALID_PAYMENT_STATUS = new Set(['pending', 'paid', 'waived', 'failed']);

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

  if (req.method === 'GET') {
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
    return;
  }

  if (req.method === 'PATCH') {
    try {
      const body = await readBody(req);
      const id = (body.id || req.query.id || '').trim();
      if (!id) {
        res.status(400).json({ success: false, message: 'Missing project id' });
        return;
      }

      const supabase = getSupabase();
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
      let publishDeliverable = false;

      if (body.payment_status !== undefined) {
        if (!VALID_PAYMENT_STATUS.has(body.payment_status)) {
          res.status(400).json({ success: false, message: 'Invalid payment_status' });
          return;
        }
        patch.payment_status = body.payment_status;
      }

      if (body.deliverable_json !== undefined) {
        const normalized = normalizeDeliverable(body.deliverable_json, existing);
        const validation = validateDeliverable(normalized);
        if (!validation.valid) {
          res.status(400).json({ success: false, message: 'Invalid deliverable', errors: validation.errors });
          return;
        }
        patch.deliverable_json = normalized;
      }

      if (body.portal_visible !== undefined) {
        patch.portal_visible = Boolean(body.portal_visible);
        if (patch.portal_visible) {
          const deliverable = patch.deliverable_json || existing.deliverable_json;
          if (!deliverable) {
            res.status(400).json({ success: false, message: 'Cannot publish without deliverable_json' });
            return;
          }
          if (!patch.deliverable_json) {
            const validation = validateDeliverable(deliverable);
            if (!validation.valid) {
              res.status(400).json({ success: false, message: 'Invalid deliverable', errors: validation.errors });
              return;
            }
          }
          patch.deliverable_published_at = new Date().toISOString();
          publishDeliverable = !existing.portal_visible;
        }
      }

      if (!Object.keys(patch).length) {
        res.status(400).json({ success: false, message: 'Nothing to update' });
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      if (publishDeliverable) {
        await safeSend(sendDeliverableReady, data);
      }

      res.status(200).json({ success: true, project: data });
    } catch (e) {
      console.error('Project patch error:', e);
      res.status(500).json({ success: false, message: 'Could not update project' });
    }
    return;
  }

  res.status(405).json({ success: false, message: 'Method not allowed' });
};