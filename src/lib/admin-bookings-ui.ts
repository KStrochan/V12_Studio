import { TZDate } from '@date-fns/tz'
import { BUSINESS_TZ } from './slots'
import type { BookingStatus } from './booking-transitions'

export type BookingView = {
  id: string
  status: BookingStatus
  start: string
  end: string
  postNo: number
  service: string
  clientName: string
  phone: string
  car: string
  comment: string
  source: string
}

export type ServiceOption = { id: string; title: string; durationMin: number }

const dayFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
const timeFmt = new Intl.DateTimeFormat('uk-UA', {
  timeZone: BUSINESS_TZ,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})
const longDayFmt = new Intl.DateTimeFormat('uk-UA', {
  timeZone: BUSINESS_TZ,
  weekday: 'short',
  day: 'numeric',
  month: 'long',
})

/** YYYY-MM-DD in Kyiv. */
export const kyivDay = (iso: string | Date) => dayFmt.format(typeof iso === 'string' ? new Date(iso) : iso)
export const kyivTime = (iso: string) => timeFmt.format(new Date(iso))
export const kyivLongDay = (day: string) => longDayFmt.format(new Date(`${day}T12:00:00Z`))

/** Minutes since local midnight in Kyiv. */
export function kyivMinutes(iso: string): number {
  const [h, m] = kyivTime(iso).split(':').map(Number)
  return h * 60 + m
}

/** "2026-10-14" + "10:00" (Kyiv wall time) -> ISO instant. */
export function kyivToIso(day: string, time: string): string {
  const [y, mo, d] = day.split('-').map(Number)
  const [h, mi] = time.split(':').map(Number)
  return new Date(new TZDate(y, mo - 1, d, h, mi, 0, BUSINESS_TZ).getTime()).toISOString()
}

export function shiftDay(day: string, delta: number): string {
  return new Date(Date.parse(`${day}T12:00:00Z`) + delta * 86_400_000).toISOString().slice(0, 10)
}

export const STATUS_STYLE: Record<BookingStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  confirmed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  rejected: 'bg-red-500/15 text-red-300 border-red-500/40',
  done: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
  cancelled: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/40',
}

export const SWIPE_THRESHOLD = 90

/** Maps a horizontal drag offset (px) to an action; swipe-left only asks for confirmation in the UI. */
export function swipeAction(offsetX: number): 'confirm' | 'reject' | null {
  if (offsetX > SWIPE_THRESHOLD) return 'confirm'
  if (offsetX < -SWIPE_THRESHOLD) return 'reject'
  return null
}
