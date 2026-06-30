import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  formatLocalDateDisplay,
  parseLocalDateStr,
  toLocalDateStr
} from '../utils/dateTime'
import './DateInput.css'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function buildCalendarDays(viewDate) {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const first = new Date(year, month, 1)
  const start = new Date(first)
  start.setDate(start.getDate() - ((first.getDay() + 6) % 7))

  const days = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    days.push({
      date,
      outside: date.getMonth() !== month
    })
  }
  return days
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
  )
}

function isDateDisabled(date, min, max) {
  const str = toLocalDateStr(date)
  if (min && str < min) return true
  if (max && str > max) return true
  return false
}

const DateInput = ({
  id,
  value = '',
  onChange,
  className = 'date-input',
  disabled = false,
  min,
  max,
  placeholder = 'ДД.ММ.ГГГГ'
}) => {
  const wrapRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => parseLocalDateStr(value) || new Date())

  const selectedDate = useMemo(() => parseLocalDateStr(value), [value])
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(viewDate),
    [viewDate]
  )

  const calendarDays = useMemo(() => buildCalendarDays(viewDate), [viewDate])

  useEffect(() => {
    if (open && selectedDate) {
      setViewDate(selectedDate)
    }
  }, [open, selectedDate])

  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const selectDate = useCallback((date) => {
    if (isDateDisabled(date, min, max)) return
    onChange?.(toLocalDateStr(date))
    setOpen(false)
  }, [min, max, onChange])

  const handleClear = () => {
    onChange?.('')
    setOpen(false)
  }

  const handleToday = () => {
    if (isDateDisabled(today, min, max)) return
    onChange?.(toLocalDateStr(today))
    setViewDate(today)
    setOpen(false)
  }

  const goPrevMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goNextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const displayText = value ? formatLocalDateDisplay(value) : placeholder

  return (
    <div className={`date-input-wrap${open ? ' date-input-wrap--open' : ''}`} ref={wrapRef}>
      <button
        type="button"
        id={id}
        className={`date-input-trigger ${className}${!value ? ' date-input-trigger--empty' : ''}`}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((v) => !v)}
      >
        <span className="date-input-display">{displayText}</span>
        <span className="date-input-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
            <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="date-picker" role="dialog" aria-label="Выбор даты">
          <div className="date-picker-header">
            <span className="date-picker-month">{monthLabel}</span>
            <div className="date-picker-nav">
              <button type="button" className="date-picker-nav-btn" onClick={goPrevMonth} aria-label="Предыдущий месяц">
                ‹
              </button>
              <button type="button" className="date-picker-nav-btn" onClick={goNextMonth} aria-label="Следующий месяц">
                ›
              </button>
            </div>
          </div>

          <div className="date-picker-weekdays">
            {WEEKDAYS.map((day) => (
              <span key={day} className="date-picker-weekday">{day}</span>
            ))}
          </div>

          <div className="date-picker-grid">
            {calendarDays.map(({ date, outside }) => {
              const str = toLocalDateStr(date)
              const isSelected = selectedDate && isSameDay(date, selectedDate)
              const isToday = isSameDay(date, today)
              const isDisabled = isDateDisabled(date, min, max)

              return (
                <button
                  key={str}
                  type="button"
                  className={[
                    'date-picker-day',
                    outside ? 'date-picker-day--outside' : '',
                    isSelected ? 'date-picker-day--selected' : '',
                    isToday ? 'date-picker-day--today' : '',
                    isDisabled ? 'date-picker-day--disabled' : ''
                  ].filter(Boolean).join(' ')}
                  disabled={isDisabled}
                  onClick={() => selectDate(date)}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>

          <div className="date-picker-footer">
            <button type="button" className="date-picker-footer-btn" onClick={handleClear}>
              Удалить
            </button>
            <button
              type="button"
              className="date-picker-footer-btn"
              onClick={handleToday}
              disabled={isDateDisabled(today, min, max)}
            >
              Сегодня
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DateInput
