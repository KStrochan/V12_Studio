const TZ = 'Europe/Kyiv'
const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
const wd = new Intl.DateTimeFormat('uk-UA', { timeZone: 'UTC', weekday: 'short' })
const full = new Intl.DateTimeFormat('uk-UA', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' })
const hm = new Intl.DateTimeFormat('uk-UA', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

export type Day = { iso: string; dow: number; weekday: string; dayNum: number; label: string }

/** The next `count` calendar days starting today in Europe/Kyiv. */
export function kyivDays(count = 14, now = new Date()): Day[] {
  const [y, m, d] = ymd.format(now).split('-').map(Number)
  return Array.from({ length: count }, (_, i) => {
    const t = new Date(Date.UTC(y, m - 1, d + i))
    return {
      iso: t.toISOString().slice(0, 10),
      dow: t.getUTCDay(),
      weekday: wd.format(t),
      dayNum: t.getUTCDate(),
      label: full.format(t),
    }
  })
}

export function formatTime(iso: string): string {
  return hm.format(new Date(iso))
}
