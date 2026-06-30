/** Бейдж в шапке: admin → A, Sotrudnik567 → 567 */
export function getUserBadgeLabel(user) {
  if (!user?.username) return ''
  if (user.role === 'admin') return 'A'
  const match = user.username.match(/(\d+)\s*$/)
  if (match) return match[1]
  const u = user.username
  return u.length <= 4 ? u : u.slice(-4)
}

export function getUserTitle(user, activePointName) {
  if (!user?.username) return ''
  const parts = [user.username]
  if (activePointName) parts.push(`Точка: ${activePointName}`)
  return parts.join(' · ')
}

export function canSelectActivePoint(user) {
  return user?.role === 'admin' || user?.accessAllPoints === true
}
