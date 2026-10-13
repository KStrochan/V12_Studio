import { describe, it, expect } from 'vitest'
import { computeSlots, type WorkingHours, type Busy } from './slots'

const day = { open: '09:00', close: '18:00' }
const hours: WorkingHours = { '0': null, '1': day, '2': day, '3': day, '4': day, '5': day, '6': null }
const allDays: WorkingHours = { '0': day, '1': day, '2': day, '3': day, '4': day, '5': day, '6': day }
const base = {
  date: '2026-10-14', // Wednesday
  durationMin: 60,
  hours,
  posts: 1,
  stepMin: 30,
  minLeadMin: 0,
  now: new Date('2026-10-01T00:00:00Z'),
  daysOff: [] as string[],
  busy: [] as Busy[],
}
// Kyiv is UTC+3 in October (EEST)
const kyiv = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return new Date(Date.UTC(2026, 9, 14, h - 3, m))
}
const hm = (iso: string) => {
  const d = new Date(new Date(iso).getTime() + 3 * 3600_000)
  return d.toISOString().slice(11, 16)
}

describe('computeSlots', () => {
  it('weekday 60 min: 17 slots from 09:00 to 17:00', () => {
    const s = computeSlots(base)
    expect(s).toHaveLength(17)
    expect(hm(s[0].start)).toBe('09:00')
    expect(hm(s[s.length - 1].start)).toBe('17:00')
  })
  it('120 min: last slot 16:00', () => {
    const s = computeSlots({ ...base, durationMin: 120 })
    expect(hm(s[s.length - 1].start)).toBe('16:00')
  })
  it('busy 10:00-11:00 removes 09:30, 10:00, 10:30', () => {
    const s = computeSlots({ ...base, busy: [{ start: kyiv('10:00'), end: kyiv('11:00'), postNo: 1 }] })
    const times = s.map((x) => hm(x.start))
    expect(times).not.toContain('09:30')
    expect(times).not.toContain('10:00')
    expect(times).not.toContain('10:30')
    expect(times).toContain('09:00')
    expect(times).toContain('11:00')
  })
  it('2 posts: busy post 1 offers post 2', () => {
    const s = computeSlots({ ...base, posts: 2, busy: [{ start: kyiv('10:00'), end: kyiv('11:00'), postNo: 1 }] })
    const slot = s.find((x) => hm(x.start) === '10:00')
    expect(slot?.postNo).toBe(2)
    expect(s.find((x) => hm(x.start) === '09:00')?.postNo).toBe(1)
  })
  it('day off and Sunday give []', () => {
    expect(computeSlots({ ...base, daysOff: ['2026-10-14'] })).toEqual([])
    expect(computeSlots({ ...base, date: '2026-10-18' })).toEqual([])
  })
  it('min lead time: now 08:30, lead 60 -> first slot 09:30', () => {
    const s = computeSlots({ ...base, now: kyiv('08:30'), minLeadMin: 60 })
    expect(hm(s[0].start)).toBe('09:30')
  })
  it('non-positive step or duration gives [] (no infinite loop)', () => {
    expect(computeSlots({ ...base, stepMin: 0 })).toEqual([])
    expect(computeSlots({ ...base, durationMin: 0 })).toEqual([])
  })
  it('DST day 2026-03-29: 09:00 Kyiv = 06:00Z', () => {
    const s = computeSlots({ ...base, date: '2026-03-29', hours: allDays, now: new Date('2026-03-01T00:00:00Z') })
    expect(s[0].start).toBe('2026-03-29T06:00:00.000Z')
  })
})
