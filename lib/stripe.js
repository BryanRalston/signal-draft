const Stripe = require('stripe');
const { getTierPriceCents, getTierLabel } = require('./pricing');
const { getSiteUrl } = require('./site');

let stripeClient;

function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function getStripe() {
  if (!isStripeConfigured()) return null;
  if (!stripeClient) stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripeClient;
}

async function createCheckoutSession({
  projectId,
  clientToken,
  tier,
  contactEmail,
  contactName,
  companyName,
}) {
  const stripe = getStripe();
  if (!stripe) return null;

  const amountCents = getTierPriceCents(tier);
  const site = getSiteUrl();
  const tierLabel = getTierLabel(tier);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: contactEmail,
    client_reference_id: projectId,
    metadata: {
      projectId,
      clientToken,
      tier,
    },
    line_items: [{
      price_data: {
        currency: 'usd',
        unit_amount: amountCents,
        product_data: {
          name: `SignalDraft ${tierLabel}`,
          description: `Survey design for ${companyName}`,
        },
      },
      quantity: 1,
    }],
    success_url: `${site}/create/received.html?token=${encodeURIComponent(clientToken)}&payment=success`,
    cancel_url: `${site}/create/received.html?token=${encodeURIComponent(clientToken)}&payment=cancel`,
  });

  return {
    sessionId: session.id,
    checkoutUrl: session.url,
    amountCents,
  };
}

function constructWebhookEvent(rawBody, signature) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    throw new Error('Stripe webhook not configured');
  }
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}

module.exports = {
  isStripeConfigured,
  getStripe,
  createCheckoutSession,
  constructWebhookEvent,
};