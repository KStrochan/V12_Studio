/** Pure "add to calendar" helpers (no server-only imports; used by client code). */

export type CalendarEvent = {
  uid: string
  title: string
  startUtc: string
  endUtc: string
  location: string
  description: string
}

export type CalendarEventInput = {
  bookingId: string
  serviceName: string
  startIso: string
  durationMin?: number | null
  address?: string | null
  phone?: string | null
}

const DEFAULT_DURATION_MIN = 60
const PENDING_NOTE = "Запис очікує підтвердження — ми зв'яжемося з вами."

/** `YYYYMMDDTHHMMSSZ` in UTC. */
function utcStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

/** Address still holds the built-in placeholder (or is empty). */
function isPlaceholderAddress(a: string): boolean {
  return !a.trim() || a.includes('…') || a.includes('...')
}

function isPlaceholderPhone(p: string): boolean {
  return p.replace(/\D/g, '').length < 12
}

export function buildCalendarEvent(input: CalendarEventInput): CalendarEvent {
  const start = new Date(input.startIso)
  const dur =
    typeof input.durationMin === 'number' && Number.isFinite(input.durationMin) && input.durationMin > 0
      ? input.durationMin
      : DEFAULT_DURATION_MIN
  const end = new Date(start.getTime() + dur * 60_000)
  const address = (input.address ?? '').trim()
  const phone = (input.phone ?? '').trim()
  const parts = [PENDING_NOTE]
  if (phone && !isPlaceholderPhone(phone)) parts.push(`Телефон: ${phone}`)
  return {
    uid: `${input.bookingId}@v12-service`,
    title: `V12 Service: ${input.serviceName}`,
    startUtc: utcStamp(start),
    endUtc: utcStamp(end),
    location: isPlaceholderAddress(address) ? '' : address,
    description: parts.join('\n'),
  }
}

export function googleCalendarUrl(ev: CalendarEvent): string {
  const q = [
    'action=TEMPLATE',
    `text=${encodeURIComponent(ev.title)}`,
    `dates=${ev.startUtc}/${ev.endUtc}`,
    `details=${encodeURIComponent(ev.description)}`,
  ]
  if (ev.location) q.push(`location=${encodeURIComponent(ev.location)}`)
  return `https://calendar.google.com/calendar/render?${q.join('&')}`
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r\n|\r|\n/g, '\\n')
}

const encoder = new TextEncoder()

/** Folds a content line at 75 octets (continuations start with one space), never splitting a character. */
export function foldLine(line: string): string {
  if (encoder.encode(line).length <= 75) return line
  const out: string[] = []
  let cur = ''
  let curBytes = 0
  for (const ch of line) {
    const n = encoder.encode(ch).length
    if (curBytes + n > 75) {
      out.push(cur)
      cur = ' '
      curBytes = 1
    }
    cur += ch
    curBytes += n
  }
  out.push(cur)
  return out.join('\r\n')
}

export function buildIcs(ev: CalendarEvent, now: Date = new Date()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//V12 Service//Booking//UK',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${ev.uid}`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${ev.startUtc}`,
    `DTEND:${ev.endUtc}`,
    `SUMMARY:${escapeText(ev.title)}`,
    `DESCRIPTION:${escapeText(ev.description)}`,
  ]
  if (ev.location) lines.push(`LOCATION:${escapeText(ev.location)}`)
  lines.push(
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(ev.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  )
  return lines.map(foldLine).join('\r\n') + '\r\n'
}
