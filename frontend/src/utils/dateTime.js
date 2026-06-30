// Используем МСК (Московское время), которое совпадает с минским (UTC+3)
const TIME_ZONE = 'Europe/Moscow'
const LOCALE = 'ru-RU'

const toDate = (value) => {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export const formatMinskDate = (value) => {
  const d = toDate(value)
  if (!d) return '—'
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d)
}

export const formatMinskDateTime = (value) => {
  const d = toDate(value)
  if (!d) return '—'
  // Форматируем дату и время в формате: ДД.ММ.ГГГГ, ЧЧ:ММ
  const dateTime = new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(d)
  return dateTime
}

/** YYYY-MM-DD из локальной даты */
export const toLocalDateStr = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Парсинг YYYY-MM-DD в локальную Date (полночь) */
export const parseLocalDateStr = (str) => {
  if (!str || typeof str !== 'string') return null
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const y = Number(match[1])
  const m = Number(match[2])
  const d = Number(match[3])
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null
  return date
}

/** Отображение YYYY-MM-DD как ДД.ММ.ГГГГ */
export const formatLocalDateDisplay = (str) => {
  const date = parseLocalDateStr(str)
  if (!date) return ''
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)
}

export const todayLocalDateStr = () => toLocalDateStr(new Date())

