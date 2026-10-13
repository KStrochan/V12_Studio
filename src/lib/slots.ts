import { TZDate } from '@date-fns/tz'

export const BUSINESS_TZ = 'Europe/Kyiv'

export type DayHours = { open: string; close: string } | null
export type WorkingHours = Record<'0' | '1' | '2' | '3' | '4' | '5' | '6', DayHours>
export type Busy = { start: Date; end: Date; postNo: number }
export type Slot = { start: string; postNo: number }

export function computeSlots(p: {
  date: string
  durationMin: number
  hours: WorkingHours
  posts: number
  stepMin: number
  minLeadMin: number
  now: Date
  daysOff: string[]
  busy: Busy[]
}): Slot[] {
  if (p.stepMin <= 0 || p.durationMin <= 0) return []
  if (p.daysOff.includes(p.date)) return []
  const [y, mo, d] = p.date.split('-').map(Number)
  const dow = new TZDate(y, mo - 1, d, BUSINESS_TZ).getDay()
  const dh = p.hours[String(dow) as keyof WorkingHours]
  if (!dh) return []

  const at = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number)
    return new TZDate(y, mo - 1, d, h, m, 0, BUSINESS_TZ).getTime()
  }
  const open = at(dh.open)
  const close = at(dh.close)
  const earliest = p.now.getTime() + p.minLeadMin * 60_000
  const dur = p.durationMin * 60_000
  const step = p.stepMin * 60_000

  const slots: Slot[] = []
  for (let t = open; t + dur <= close; t += step) {
    if (t < earliest) continue
    const end = t + dur
    for (let post = 1; post <= p.posts; post++) {
      const clash = p.busy.some(
        (b) => b.postNo === post && b.start.getTime() < end && b.end.getTime() > t,
      )
      if (!clash) {
        slots.push({ start: new Date(t).toISOString(), postNo: post })
        break
      }
    }
  }
  return slots
}
