const { getSupabase } = require('../lib/supabase');
const { setCors, handleOptions } = require('../lib/cors');
const { inferTier } = require('../lib/prompt');
const { isStripeConfigured, createCheckoutSession } = require('../lib/stripe');
const { getTierPriceCents } = require('../lib/pricing');
const { safeSend, sendIntakeReceived } = require('../lib/email');

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

  try {
    const body = await readBody(req);

    if (body.botcheck) {
      res.status(200).json({ success: true });
      return;
    }

    const intake = body.intake || body;
    const contactName = (intake.contactName || '').trim();
    const contactEmail = (intake.contactEmail || '').trim();
    const companyName = (intake.companyName || '').trim();
    const useCase = intake.useCase || 'csat';

    if (!contactName || !contactEmail || !companyName) {
      res.status(400).json({ success: false, message: 'Missing required contact or company fields' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      res.status(400).json({ success: false, message: 'Invalid email' });
      return;
    }

    const turnaroundHours = Number(process.env.TURNAROUND_HOURS || 48);
    const dueAt = new Date(Date.now() + turnaroundHours * 60 * 60 * 1000).toISOString();
    const tier = inferTier(intake);
    const stripeEnabled = isStripeConfigured();

    const row = {
      status: 'received',
      tier,
      due_at: dueAt,
      intake_json: intake,
      contact_name: contactName,
      contact_email: contactEmail,
      company_name: companyName,
      use_case: useCase,
      payment_status: stripeEnabled ? 'pending' : 'waived',
      amount_cents: stripeEnabled ? getTierPriceCents(tier) : null,
    };

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('projects')
      .insert(row)
      .select('id, client_token, due_at, tier, payment_status, contact_name, contact_email, company_name, use_case')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      res.status(500).json({ success: false, message: 'Could not save brief' });
      return;
    }

    let checkoutUrl = null;
    if (stripeEnabled) {
      try {
        const checkout = await createCheckoutSession({
          projectId: data.id,
          clientToken: data.client_token,
          tier: data.tier,
          contactEmail,
          contactName,
          companyName,
        });
        if (checkout) {
          checkoutUrl = checkout.checkoutUrl;
          await supabase
            .from('projects')
            .update({ stripe_checkout_session_id: checkout.sessionId })
            .eq('id', data.id);
        }
      } catch (stripeErr) {
        console.error('Stripe checkout error:', stripeErr);
        await supabase
          .from('projects')
          .update({ payment_status: 'waived' })
          .eq('id', data.id);
        data.payment_status = 'waived';
      }
    }

    await safeSend(sendIntakeReceived, { ...data, client_token: data.client_token });

    res.status(200).json({
      success: true,
      projectId: data.id,
      clientToken: data.client_token,
      dueAt: data.due_at,
      tier: data.tier,
      paymentStatus: data.payment_status,
      checkoutUrl,
    });
  } catch (e) {
    console.error('Intake error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};