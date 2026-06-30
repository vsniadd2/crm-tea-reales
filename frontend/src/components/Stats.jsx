import React from 'react'
import './Stats.css'

const Stats = ({ globalStats, loading }) => {
  const total = loading ? '…' : (globalStats?.total ?? 0)
  const gold = loading ? '…' : (globalStats?.gold ?? 0)
  const silver = loading ? '…' : (globalStats?.silver ?? 0)
  const standart = loading ? '…' : (globalStats?.standart ?? 0)
  const personalDiscount = loading ? '…' : (globalStats?.personalDiscount ?? 0)

  return (
    <div className="stats">
      <div className="stat-card">
        <span className="stat-label">Всего клиентов</span>
        <span className="stat-value">{total}</span>
      </div>
      <div className="stat-card standart">
        <span className="stat-label">Standart клиенты</span>
        <span className="stat-value">{standart}</span>
      </div>
      <div className="stat-card silver">
        <span className="stat-label">Silver клиенты</span>
        <span className="stat-value">{silver}</span>
      </div>
      <div className="stat-card gold">
        <span className="stat-label">Gold клиенты</span>
        <span className="stat-value">{gold}</span>
      </div>
      <div className="stat-card personal-discount">
        <span className="stat-label">Персональная скидка</span>
        <span className="stat-value">{personalDiscount}</span>
      </div>
    </div>
  )
}

export default React.memo(Stats)
