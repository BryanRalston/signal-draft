const { getSupabase } = require('../../lib/supabase');
const { constructWebhookEvent } = require('../../lib/stripe');
const { safeSend, sendPaymentConfirmed } = require('../../lib/email');

async function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports.config = {
  api: {
    bodyParser: false,
  },
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  try {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      res.status(400).json({ success: false, message: 'Missing stripe-signature' });
      return;
    }

    const rawBody = await readRawBody(req);
    const event = constructWebhookEvent(rawBody, signature);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const projectId = session.metadata?.projectId;
      if (!projectId) {
        console.warn('Stripe webhook: missing projectId in metadata');
        res.status(200).json({ received: true });
        return;
      }

      const supabase = getSupabase();
      const patch = {
        payment_status: 'paid',
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id || null,
      };
      if (session.amount_total) patch.amount_cents = session.amount_total;

      const { data: project, error } = await supabase
        .from('projects')
        .update(patch)
        .eq('id', projectId)
        .select('*')
        .single();

      if (error) {
        console.error('Stripe webhook update error:', error);
        res.status(500).json({ success: false, message: 'Could not update project' });
        return;
      }

      await safeSend(sendPaymentConfirmed, project);
    }

    res.status(200).json({ received: true });
  } catch (e) {
    console.error('Stripe webhook error:', e);
    res.status(400).json({ success: false, message: e.message || 'Webhook error' });
  }
};