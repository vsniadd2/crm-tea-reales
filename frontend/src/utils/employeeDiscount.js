export const EMPLOYEE_DISCOUNT_PERCENT = 10

export function calcEmployeeDiscountAmount(baseFinalAmount, isEmployee) {
  if (!isEmployee) return 0
  const base = Number.parseFloat(baseFinalAmount)
  if (!Number.isFinite(base) || base <= 0) return 0
  return Math.round(base * (EMPLOYEE_DISCOUNT_PERCENT / 100) * 100) / 100
}

export function applyEmployeeDiscount(baseFinalAmount, isEmployee) {
  const base = Number.parseFloat(baseFinalAmount)
  if (!Number.isFinite(base) || base <= 0) {
    return { amount: 0, finalAmount: 0 }
  }
  const amount = calcEmployeeDiscountAmount(base, isEmployee)
  return {
    amount,
    finalAmount: Math.max(0, Math.round((base - amount) * 100) / 100)
  }
}

export function formatEmployeeDiscountHint() {
  return `(−${EMPLOYEE_DISCOUNT_PERCENT}% к заказу)`
}

export function formatEmployeeDiscountBadge(amount) {
  if (!amount || amount <= 0) return ''
  return ` (−${amount.toFixed(2)} BYN)`
}
