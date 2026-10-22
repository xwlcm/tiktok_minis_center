export function formatLocalDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function recentDaysRange(days: number): [string, string] {
  const end = new Date()
  const start = new Date(end)
  start.setDate(end.getDate() - Math.max(days - 1, 0))
  return [formatLocalDate(start), formatLocalDate(end)]
}

export function yesterdayTodayRange(): [string, string] {
  return recentDaysRange(2)
}
