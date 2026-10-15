import { describe, expect, it } from 'vitest'
import { buildCalendarEvent, buildIcs, googleCalendarUrl } from './calendar'

const base = {
  bookingId: 'b1',
  serviceName: 'Діагностика',
  startIso: '2026-11-03T07:00:00Z',
  durationMin: 90,
  address: 'м. Стрий, вул. Шевченка, 5',
  phone: '+380 50 123 45 67',
}
const NOTE = "Запис очікує підтвердження — ми зв'яжемося з вами."

describe('buildCalendarEvent', () => {
  it('computes UTC start/end from duration', () => {
    expect(buildCalendarEvent(base)).toEqual({
      uid: 'b1@v12-service',
      title: 'V12 Service: Діагностика',
      startUtc: '20261103T070000Z',
      endUtc: '20261103T083000Z',
      location: 'м. Стрий, вул. Шевченка, 5',
      description: `${NOTE}\nТелефон: +380 50 123 45 67`,
    })
  })
  it('falls back to 60 minutes', () => {
    expect(buildCalendarEvent({ ...base, durationMin: null }).endUtc).toBe('20261103T080000Z')
    expect(buildCalendarEvent({ ...base, durationMin: 0 }).endUtc).toBe('20261103T080000Z')
  })
  it('omits placeholder address and phone', () => {
    const ev = buildCalendarEvent({ ...base, address: 'м. Стрий, вул. … ', phone: '+380 XX XXX XX XX' })
    expect(ev.location).toBe('')
    expect(ev.description).toBe(NOTE)
    expect(buildCalendarEvent({ ...base, address: '  ' }).location).toBe('')
  })
})

describe('googleCalendarUrl', () => {
  it('encodes Cyrillic and puts UTC dates', () => {
    const url = googleCalendarUrl(buildCalendarEvent({ ...base, phone: null }))
    expect(url).toBe(
      'https://calendar.google.com/calendar/render?action=TEMPLATE' +
        '&text=V12%20Service%3A%20%D0%94%D1%96%D0%B0%D0%B3%D0%BD%D0%BE%D1%81%D1%82%D0%B8%D0%BA%D0%B0' +
        '&dates=20261103T070000Z/20261103T083000Z' +
        `&details=${encodeURIComponent(NOTE)}` +
        `&location=${encodeURIComponent('м. Стрий, вул. Шевченка, 5')}`,
    )
    expect(url).toContain('text=V12%20Service%3A%20%D0%94%D1%96')
  })
  it('omits location when empty', () => {
    expect(googleCalendarUrl(buildCalendarEvent({ ...base, address: '' }))).not.toContain('location=')
  })
})

describe('buildIcs', () => {
  const now = new Date('2026-10-14T12:34:56Z')
  const short = { ...buildCalendarEvent({ ...base, serviceName: 'Ремонт', address: 'Стрий, 5' }), description: 'Очікує' }

  it('produces an exact RFC 5545 body with CRLF', () => {
    expect(buildIcs(short, now)).toBe(
      [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//V12 Service//Booking//UK',
        'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        'UID:b1@v12-service',
        'DTSTAMP:20261014T123456Z',
        'DTSTART:20261103T070000Z',
        'DTEND:20261103T083000Z',
        'SUMMARY:V12 Service: Ремонт',
        'DESCRIPTION:Очікує',
        'LOCATION:Стрий\\, 5',
        'BEGIN:VALARM',
        'TRIGGER:-PT1H',
        'ACTION:DISPLAY',
        'DESCRIPTION:V12 Service: Ремонт',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR',
        '',
      ].join('\r\n'),
    )
  })
  it('omits LOCATION for a placeholder address', () => {
    const ev = buildCalendarEvent({ ...base, address: 'м. Стрий, вул. … ' })
    expect(buildIcs(ev, now)).not.toContain('LOCATION')
  })
  it('escapes commas, semicolons, backslashes and newlines', () => {
    const ics = buildIcs({ ...short, title: 'a,b;c\\d', description: 'x\ny', location: '' }, now)
    expect(ics).toContain('SUMMARY:a\\,b\\;c\\\\d\r\n')
    expect(ics).toContain('DESCRIPTION:x\\ny\r\n')
  })
  it('folds long lines at 75 octets without splitting characters', () => {
    const ics = buildIcs({ ...short, description: 'Я'.repeat(100) }, now)
    const enc = new TextEncoder()
    for (const l of ics.split('\r\n')) expect(enc.encode(l).length).toBeLessThanOrEqual(75)
    expect(ics.replace(/\r\n /g, '')).toContain(`DESCRIPTION:${'Я'.repeat(100)}\r\n`)
    // "DESCRIPTION:" is 12 octets + 31 two-byte letters = 74; a 32nd would be 76
    expect(ics).toContain(`DESCRIPTION:${'Я'.repeat(31)}\r\n ${'Я'.repeat(37)}\r\n ${'Я'.repeat(32)}\r\n`)
  })
  it('folds the standard description', () => {
    const ics = buildIcs(buildCalendarEvent(base), now)
    expect(ics).toContain(`DESCRIPTION:${NOTE.replace(',', '\\,')}`.slice(0, 40))
    expect(ics.replace(/\r\n /g, '')).toContain(`DESCRIPTION:${NOTE}\\nТелефон: +380 50 123 45 67\r\n`)
  })
})
