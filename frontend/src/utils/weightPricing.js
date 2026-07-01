export function getBaseWeightGrams(product) {
  const v = product?.base_weight_grams ?? product?.baseWeightGrams
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function calcPriceByWeight(basePrice, baseGrams, selectedGrams) {
  const price = Number(basePrice) || 0
  const base = Number(baseGrams)
  if (!Number.isFinite(base) || base <= 0) return price
  const grams = Number(selectedGrams)
  if (!Number.isFinite(grams) || grams <= 0) return 0
  return Math.round((price * (grams / base)) * 100) / 100
}

export function getLineUnitPrice(product, selectedGrams) {
  const baseGrams = getBaseWeightGrams(product)
  const basePrice = Number(product?.price) || 0
  if (!baseGrams) return basePrice
  const grams = selectedGrams ?? baseGrams
  return calcPriceByWeight(basePrice, baseGrams, grams)
}

export function formatProductPriceLabel(product) {
  const price = Number(product?.price) || 0
  const baseGrams = getBaseWeightGrams(product)
  if (baseGrams) {
    return `${baseGrams}г — ${price.toFixed(2)} BYN`
  }
  return `${price.toFixed(2)} BYN`
}

export function cartItemToOrderLine(item) {
  const unitPrice = item.unitPrice ?? getLineUnitPrice(item.product, item.grams)
  return {
    productId: item.product.id,
    productName: item.product.name,
    productPrice: unitPrice,
    quantity: item.quantity,
    weightGrams: item.grams ?? null
  }
}

export function getCartLineTotal(item) {
  const unitPrice = item.unitPrice ?? getLineUnitPrice(item.product, item.grams)
  return unitPrice * (item.quantity || 1)
}

export function formatOrderItemLabel(item) {
  const name = item?.product_name || item?.productName || ''
  const wg = item?.weight_grams ?? item?.weightGrams
  if (wg != null && Number(wg) > 0) {
    return `${name} (${wg} г)`
  }
  return name
}
