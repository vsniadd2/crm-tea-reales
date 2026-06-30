import React from 'react'
import { formatClientStatus } from '../utils/clientTier'
import { clampDiscountPercent } from '../utils/clientDiscount'
import './ClientStatusChip.css'

function formatDiscountLabel(value) {
  const n = clampDiscountPercent(value)
  if (n <= 0) return null
  if (Number.isInteger(n)) return `${n}%`
  return `${n.toFixed(1).replace(/\.0$/, '')}%`
}

const ClientStatusChip = ({
  status = 'standart',
  personalDiscount,
  className = '',
  dataLabel
}) => {
  const normalized = (status || 'standart').toLowerCase()
  const personalLabel = formatDiscountLabel(personalDiscount)

  return (
    <span
      className={[
        'status-chip',
        normalized,
        personalLabel ? 'has-personal-discount' : '',
        className
      ].filter(Boolean).join(' ')}
      data-label={dataLabel}
      title={personalLabel ? `Персональная скидка: ${personalLabel}` : undefined}
    >
      {formatClientStatus(normalized)}
      {personalLabel && (
        <span className="status-chip-personal">{personalLabel}</span>
      )}
    </span>
  )
}

export default ClientStatusChip
