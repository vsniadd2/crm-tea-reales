import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { orderStatsService } from '../services/orderStatsService'
import { useNotification } from './NotificationProvider'
import DateInput from './DateInput'
import { DonutChartSection } from './DonutChart'
import './OrderDetailsPage.css'

const OrderDetailsPage = () => {
  const { refreshAccessToken } = useAuth()
  const { showNotification } = useNotification()
  const [loading, setLoading] = useState(true)
  const [paymentStats, setPaymentStats] = useState(null)
  const [productsStats, setProductsStats] = useState([])
  const [categoriesStats, setCategoriesStats] = useState([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const loadStats = async () => {
    try {
      setLoading(true)
      try {
        const [paymentData, productsData, categoriesData] = await Promise.all([
          orderStatsService.getPaymentStats(dateFrom || null, dateTo || null),
          orderStatsService.getProductsStats(dateFrom || null, dateTo || null),
          orderStatsService.getCategoriesStats(dateFrom || null, dateTo || null)
        ])
        setPaymentStats(paymentData)
        setProductsStats(productsData.products || [])
        setCategoriesStats(categoriesData.categories || [])
      } catch (e) {
        if (e?.message === 'UNAUTHORIZED') {
          const refreshed = await refreshAccessToken()
          if (refreshed) {
            const [paymentData, productsData, categoriesData] = await Promise.all([
              orderStatsService.getPaymentStats(dateFrom || null, dateTo || null),
              orderStatsService.getProductsStats(dateFrom || null, dateTo || null),
              orderStatsService.getCategoriesStats(dateFrom || null, dateTo || null)
            ])
            setPaymentStats(paymentData)
            setProductsStats(productsData.products || [])
            setCategoriesStats(categoriesData.categories || [])
            return
          }
        }
        throw e
      }
    } catch (err) {
      showNotification(err.message || 'Ошибка загрузки статистики', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [dateFrom, dateTo])

  const handleClearFilters = () => {
    setDateFrom('')
    setDateTo('')
  }

  const dateLabel = dateFrom && dateTo
    ? (dateFrom === dateTo
        ? new Date(dateFrom).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
        : `${new Date(dateFrom).toLocaleDateString('ru-RU')} – ${new Date(dateTo).toLocaleDateString('ru-RU')}`)
    : null

  // Данные для графика способов оплаты (формат как для donut)
  const paymentChartData = paymentStats ? [
    { name: 'Наличные', revenue: paymentStats.cash.total, count: paymentStats.cash.count },
    { name: 'Карта', revenue: paymentStats.card.total, count: paymentStats.card.count }
  ] : []

  if (loading) {
    return (
      <div className="order-details-page">
        <div className="order-details-loading">
          <div className="loading-spinner">Загрузка статистики...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="order-details-page">
      <div className="order-details-header">
        <h2>Статистика продаж</h2>
        <div className="order-details-filters">
          <div className="filter-group">
            <label htmlFor="dateFrom">От:</label>
            <DateInput
              id="dateFrom"
              value={dateFrom}
              onChange={setDateFrom}
              className="date-input"
            />
          </div>
          <div className="filter-group">
            <label htmlFor="dateTo">До:</label>
            <DateInput
              id="dateTo"
              value={dateTo}
              onChange={setDateTo}
              className="date-input"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button onClick={handleClearFilters} className="clear-btn">
              Сбросить
            </button>
          )}
        </div>
      </div>

      <div className="order-details-content">
        {/* График способов оплаты */}
        {paymentStats && paymentChartData.length > 0 ? (
          <>
            <DonutChartSection title="Способы оплаты" dateLabel={dateLabel} data={paymentChartData} />
            <div className="chart-section">
              <div className="chart-summary">
                <div className="summary-item">
                  <span className="summary-label">Наличные:</span>
                  <span className="summary-value">{paymentStats.cash.total.toFixed(2)} BYN</span>
                  <span className="summary-count">({paymentStats.cash.count} продаж)</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Карта:</span>
                  <span className="summary-value">{paymentStats.card.total.toFixed(2)} BYN</span>
                  <span className="summary-count">({paymentStats.card.count} продаж)</span>
                </div>
                <div className="summary-item summary-total">
                  <span className="summary-label">Всего:</span>
                  <span className="summary-value">{paymentStats.total.total.toFixed(2)} BYN</span>
                  <span className="summary-count">({paymentStats.total.count} продаж)</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="chart-section">
            <h3>Способы оплаты</h3>
            <div className="empty-state">Нет данных для отображения</div>
          </div>
        )}

        {/* График продаж по товарам (напитки) */}
        {productsStats.length > 0 ? (
          <DonutChartSection title="Продажи по напиткам" dateLabel={dateLabel} data={productsStats.slice(0, 10)} />
        ) : (
          <div className="chart-section">
            <h3>Продажи по напиткам</h3>
            <div className="empty-state">Нет данных для отображения</div>
          </div>
        )}

        {/* График продаж по категориям */}
        {categoriesStats.length > 0 ? (
          <DonutChartSection title="Продажи по категориям товаров" dateLabel={dateLabel} data={categoriesStats} />
        ) : (
          <div className="chart-section">
            <h3>Продажи по категориям товаров</h3>
            <div className="empty-state">Нет данных для отображения</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderDetailsPage
