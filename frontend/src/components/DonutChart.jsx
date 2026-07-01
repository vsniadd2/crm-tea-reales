import React, { useEffect, useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import './DonutChart.css'

ChartJS.register(ArcElement, Tooltip)

export const CHART_COLORS = [
  '#ef4444', '#22c55e', '#3b82f6', '#f59e0b',
  '#4d7a42', '#ec4899', '#14b8a6', '#f97316',
]

const MIN_PERCENT_LABEL = 5

export function chartColorForIndex(index) {
  if (index < CHART_COLORS.length) {
    return CHART_COLORS[index]
  }
  const hue = (index * 47) % 360
  return `hsl(${hue}, 58%, 48%)`
}

export const toDonutData = (items, limit = 10) => {
  if (!items || items.length === 0) return []
  const total = items.reduce((s, i) => s + (i.revenue ?? i.value ?? 0), 0)
  const sliced = limit == null || limit <= 0 ? items : items.slice(0, limit)
  return sliced.map((item, i) => ({
    ...item,
    id: item.id || item.name,
    revenue: item.revenue ?? item.value ?? 0,
    quantity: item.quantity ?? null,
    count: item.orderCount ?? item.count ?? null,
    percentage: total > 0
      ? (((item.revenue ?? item.value ?? 0) / total * 100).toFixed(1))
      : '0',
    color: item.color || chartColorForIndex(i),
  }))
}

const percentLabelsPlugin = {
  id: 'percentLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart
    const meta = chart.getDatasetMeta(0)
    if (!meta?.data?.length) return

    meta.data.forEach((arc, index) => {
      const pct = Number(chart.$donutItems?.[index]?.percentage)
      if (!Number.isFinite(pct) || pct < MIN_PERCENT_LABEL) return

      const { x, y } = arc.getCenterPoint()
      const text = `${pct.toFixed(1)}%`

      ctx.save()
      ctx.font = '600 12px system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.lineWidth = 2
      ctx.strokeStyle = '#fff'
      ctx.fillStyle = '#1a1a1a'
      ctx.strokeText(text, x, y)
      ctx.fillText(text, x, y)
      ctx.restore()
    })
  },
}

ChartJS.register(percentLabelsPlugin)

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

const buildChartAnimation = (reducedMotion) => {
  if (reducedMotion) return false
  return {
    duration: 900,
    easing: 'easeOutQuart',
    animateRotate: true,
    animateScale: true,
  }
}

const buildTooltipCallbacks = () => ({
  title: (items) => items[0]?.label ?? '',
  label: (context) => {
    const item = context.chart.$donutItems?.[context.dataIndex]
    if (!item) return ''
    const lines = [`${item.percentage}%`, `${Number(item.revenue).toFixed(2)} BYN`]
    if (item.quantity != null) lines.push(`Количество: ${item.quantity} шт`)
    if (item.count != null) lines.push(`Продаж: ${item.count}`)
    return lines
  },
})

const DonutChart = ({ items, height = 350 }) => {
  const reducedMotion = usePrefersReducedMotion()

  const chartData = useMemo(() => ({
    labels: items.map((d) => d.name),
    datasets: [{
      data: items.map((d) => d.revenue),
      backgroundColor: items.map((d) => d.color),
      borderWidth: 2,
      borderColor: '#fff',
      spacing: 1,
    }],
  }), [items])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    animation: buildChartAnimation(reducedMotion),
    events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#1a1a1a',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        boxPadding: 4,
        usePointStyle: false,
        callbacks: buildTooltipCallbacks(),
      },
    },
  }), [reducedMotion])

  const chartKey = useMemo(
    () => items.map((i) => `${i.id ?? i.name}:${i.revenue}`).join('|'),
    [items]
  )

  if (!items?.length) return null

  return (
    <div
      className={`donut-chart-canvas-wrap${reducedMotion ? '' : ' donut-chart-canvas-wrap--enter'}`}
      style={{ height }}
    >
      <Doughnut
        key={chartKey}
        data={chartData}
        options={options}
        plugins={[{
          id: 'donutItemsRef',
          beforeInit(chart) {
            chart.$donutItems = items
          },
          beforeUpdate(chart) {
            chart.$donutItems = items
          },
        }]}
      />
    </div>
  )
}

export const DonutChartSection = ({
  title,
  dateLabel,
  data,
  limit = 10,
  variant = 'default',
}) => {
  const donutData = useMemo(() => toDonutData(data, limit), [data, limit])
  const totalSum = donutData.reduce((s, i) => s + (i.revenue || 0), 0)
  const isFull = variant === 'full'

  if (donutData.length === 0) return null

  return (
    <div className={`chart-section day-top-products-section chart-section--enter${isFull ? ' chart-section--full' : ''}`}>
      <div className="day-top-products-header">
        <h3>{title}</h3>
        <div className="day-info">
          {dateLabel && <span className="day-date">{dateLabel}</span>}
          <span className="day-total">Всего: {totalSum.toFixed(2)} BYN</span>
          {isFull && (
            <span className="day-items-count">Товаров: {donutData.length}</span>
          )}
        </div>
      </div>
      <div className={`day-top-products-content${isFull ? ' day-top-products-content--full' : ''}`}>
        <div className={`donut-chart-container${isFull ? ' donut-chart-container--full' : ''}`}>
          <DonutChart items={donutData} height={isFull ? 380 : 350} />
        </div>
        <div className={`day-top-products-legend${isFull ? ' day-top-products-legend--scrollable' : ''}`}>
          {donutData.map((product, index) => (
            <div
              key={product.id || index}
              className={`legend-item legend-item--enter${isFull ? ' legend-item--compact' : ''}`}
              style={{ '--legend-i': index }}
            >
              <div className="legend-color" style={{ backgroundColor: product.color }} />
              <div className="legend-content">
                <div className="legend-percentage">{product.percentage}%</div>
                <div className="legend-name">{product.name}</div>
                <div className="legend-revenue">
                  {Number(product.revenue).toFixed(2)} BYN
                  {product.quantity != null && (
                    <span className="legend-qty"> · {product.quantity} шт</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DonutChart
