const TIER_PRICES_CENTS = {
  blueprint: 39900,
  full: 99900,
  research: 199900,
};

const TIER_LABELS = {
  blueprint: 'Blueprint',
  full: 'Full Instrument',
  research: 'Research + Design',
};

function getTierPriceCents(tier) {
  return TIER_PRICES_CENTS[tier] || TIER_PRICES_CENTS.blueprint;
}

function getTierLabel(tier) {
  return TIER_LABELS[tier] || tier;
}

function formatPrice(cents) {
  return `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

module.exports = {
  TIER_PRICES_CENTS,
  TIER_LABELS,
  getTierPriceCents,
  getTierLabel,
  formatPrice,
};