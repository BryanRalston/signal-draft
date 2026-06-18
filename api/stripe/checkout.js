const { getSupabase } = require('../../lib/supabase');
const { setCors, handleOptions } = require('../../lib/cors');
const { isStripeConfigured, createCheckoutSession } = require('../../lib/stripe');

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

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  if (!isStripeConfigured()) {
    res.status(503).json({ success: false, message: 'Payments not configured' });
    return;
  }

  try {
    const body = await readBody(req);
    const clientToken = (body.clientToken || '').trim();
    if (!clientToken) {
      res.status(400).json({ success: false, message: 'Missing clientToken' });
      return;
    }

    const supabase = getSupabase();
    const { data: project, error } = await supabase
      .from('projects')
      .select('id, client_token, tier, contact_email, contact_name, company_name, payment_status')
      .eq('client_token', clientToken)
      .single();

    if (error || !project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    if (project.payment_status === 'paid' || project.payment_status === 'waived') {
      res.status(400).json({ success: false, message: 'Payment already completed' });
      return;
    }

    const checkout = await createCheckoutSession({
      projectId: project.id,
      clientToken: project.client_token,
      tier: project.tier,
      contactEmail: project.contact_email,
      contactName: project.contact_name,
      companyName: project.company_name,
    });

    if (!checkout) {
      res.status(503).json({ success: false, message: 'Could not create checkout session' });
      return;
    }

    await supabase
      .from('projects')
      .update({
        stripe_checkout_session_id: checkout.sessionId,
        amount_cents: checkout.amountCents,
        payment_status: 'pending',
      })
      .eq('id', project.id);

    res.status(200).json({
      success: true,
      checkoutUrl: checkout.checkoutUrl,
      amountCents: checkout.amountCents,
    });
  } catch (e) {
    console.error('Checkout recreate error:', e);
    res.status(500).json({ success: false, message: 'Could not create checkout' });
  }
};