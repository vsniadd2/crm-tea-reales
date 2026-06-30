export const TIER_SILVER_MIN = 250
export const TIER_GOLD_MIN = 500

export function statusFromTotalSpent(totalSpent) {
  const total = Number.parseFloat(totalSpent) || 0
  if (total >= TIER_GOLD_MIN) return 'gold'
  if (total >= TIER_SILVER_MIN) return 'silver'
  return 'standart'
}

export function loyaltyDiscountPercentForStatus(status) {
  const s = (status || 'standart').toLowerCase()
  if (s === 'gold') return 10
  if (s === 'silver') return 5
  return 0
}

export function formatClientStatus(status) {
  const s = (status || 'standart').toLowerCase()
  if (s === 'gold') return 'GOLD'
  if (s === 'silver') return 'SILVER'
  return 'STANDART'
}
