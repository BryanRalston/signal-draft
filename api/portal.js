const { getSupabase } = require('../lib/supabase');
const { setCors, handleOptions } = require('../lib/cors');
const { USE_CASE_LABELS } = require('../lib/prompt');

const STATUS_LABELS = {
  received: 'Brief received',
  researching: 'Research in progress',
  drafting: 'Survey design in progress',
  review: 'Methodology review',
  delivered: 'Delivered',
  revision: 'Revision in progress',
  closed: 'Closed',
};

module.exports = async (req, res) => {
  setCors(req, res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  const token = (req.query.token || '').trim();
  if (!token) {
    res.status(400).json({ success: false, message: 'Missing token' });
    return;
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('projects')
      .select('company_name, contact_name, use_case, status, tier, due_at, created_at, delivered_at, payment_status, portal_visible, deliverable_json, deliverable_published_at')
      .eq('client_token', token)
      .single();

    if (error || !data) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    const project = {
      companyName: data.company_name,
      contactName: data.contact_name,
      useCase: data.use_case,
      useCaseLabel: USE_CASE_LABELS[data.use_case] || data.use_case,
      status: data.status,
      statusLabel: STATUS_LABELS[data.status] || data.status,
      tier: data.tier,
      dueAt: data.due_at,
      createdAt: data.created_at,
      deliveredAt: data.delivered_at,
      paymentStatus: data.payment_status,
      portalVisible: data.portal_visible,
      deliverablePublishedAt: data.deliverable_published_at,
    };

    if (data.portal_visible && data.deliverable_json) {
      project.deliverable = data.deliverable_json;
    }

    res.status(200).json({ success: true, project });
  } catch (e) {
    console.error('Portal error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};