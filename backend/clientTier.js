const TIER_SILVER_MIN = 250;
const TIER_GOLD_MIN = 500;

function clampPersonalDiscountPercent(raw) {
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(100, Math.max(0, n));
}

function statusFromTotalSpent(totalSpent) {
  const total = Number.parseFloat(totalSpent) || 0;
  if (total >= TIER_GOLD_MIN) return 'gold';
  if (total >= TIER_SILVER_MIN) return 'silver';
  return 'standart';
}

function loyaltyDiscountPercentForStatus(status) {
  const s = (status || 'standart').toLowerCase();
  if (s === 'gold') return 10;
  if (s === 'silver') return 5;
  return 0;
}

function loyaltyDiscountPercentForPurchase(clientRow, priceFloat, opts = {}) {
  const personal = clampPersonalDiscountPercent(clientRow.personal_discount_percent);
  let tierPart = 0;
  if (!opts.isNewClientFirstPurchase) {
    const currentTotal = Number.parseFloat(clientRow.total_spent) || 0;
    const price = Number.parseFloat(priceFloat) || 0;
    const newTotal = currentTotal + price;
    const status = (clientRow.status || 'standart').toLowerCase();
    if (newTotal >= TIER_GOLD_MIN || status === 'gold') tierPart = 10;
    else if (newTotal >= TIER_SILVER_MIN || status === 'silver') tierPart = 5;
  }
  return Math.min(100, personal + tierPart);
}

function loyaltyDiscountPercentForReplacement(clientRow) {
  if (!clientRow) return 0;
  const personal = clampPersonalDiscountPercent(clientRow.personal_discount_percent);
  const tierPart = loyaltyDiscountPercentForStatus(clientRow.status);
  return Math.min(100, personal + tierPart);
}

module.exports = {
  TIER_SILVER_MIN,
  TIER_GOLD_MIN,
  statusFromTotalSpent,
  loyaltyDiscountPercentForStatus,
  loyaltyDiscountPercentForPurchase,
  loyaltyDiscountPercentForReplacement
};
