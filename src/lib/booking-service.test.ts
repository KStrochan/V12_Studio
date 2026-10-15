import { describe, it, expect, vi } from 'vitest'
import { createBooking, clientIp, handleSlotsGet, type BookingDeps } from './booking-service'
import { bookingInputSchema } from './schemas'
import type { Busy, WorkingHours } from './slots'

const day = { open: '09:00', close: '18:00' }
const hours: WorkingHours = { '0': null, '1': day, '2': day, '3': day, '4': day, '5': day, '6': null }
const SERVICE = '11111111-1111-4111-8111-111111111111'
// 2026-10-14 is Wednesday; Kyiv is UTC+3
const START = '2026-10-14T07:00:00.000Z' // 10:00 Kyiv

function makeDeps(over: Partial<BookingDeps> = {}) {
  const busy: Busy[] = []
  const deps: BookingDeps = {
    now: () => new Date('2026-10-01T00:00:00Z'),
    getService: async () => ({ id: SERVICE, durationMin: 60 }),
    getSettings: async () => ({ hours, posts: 1, stepMin: 30, minLeadMin: 0 }),
    getDaysOff: async () => [],
    getBusy: async () => busy,
    createBookingTx: vi.fn(async () => 'booking-1'),
    notify: vi.fn(async () => {}),
    ...over,
  }
  return deps
}

const parse = (over: Record<string, unknown> = {}) =>
  bookingInputSchema.parse({
    serviceId: SERVICE,
    start: START,
    name: 'Іван',
    phone: '050 111 22 33',
    carMake: 'Audi',
    carModel: 'A4',
    carYear: 2015,
    ...over,
  })

describe('createBooking date window', () => {
  const open7 = { ...hours, '0': day, '6': day }
  const mk = () => makeDeps({ getSettings: async () => ({ hours: open7, posts: 1, stepMin: 30, minLeadMin: 0 }) })

  it('rejects a start beyond today + 90 days (Kyiv) without writing', async () => {
    const d = mk()
    const r = await createBooking(parse({ start: '2027-02-01T07:00:00.000Z' }), d)
    expect(r).toMatchObject({ ok: false, invalid: true, message: 'Оберіть дату в межах найближчих 90 днів' })
    expect(d.createBookingTx).not.toHaveBeenCalled()
  })

  it('accepts the last allowed day', async () => {
    // now = 2026-10-01 -> last = 2026-12-30
    const r = await createBooking(parse({ start: '2026-12-30T07:00:00.000Z' }), mk())
    expect(r).toMatchObject({ ok: true })
  })
})

describe('createBooking', () => {
  it('free slot -> ok, writes once with normalized phone and notifies', async () => {
    const deps = makeDeps()
    const r = await createBooking(parse(), deps)
    expect(r).toEqual({ ok: true, id: 'booking-1' })
    expect(deps.createBookingTx).toHaveBeenCalledTimes(1)
    expect(vi.mocked(deps.createBookingTx).mock.calls[0][0]).toMatchObject({
      serviceId: SERVICE,
      start: START,
      end: '2026-10-14T08:00:00.000Z',
      postNo: 1,
      phone: '+380501112233',
    })
    expect(deps.notify).toHaveBeenCalledTimes(1)
  })

  it('slot not offered by computeSlots -> conflict with fresh slots, no write', async () => {
    const deps = makeDeps({
      getBusy: async () => [
        { start: new Date('2026-10-14T07:00:00Z'), end: new Date('2026-10-14T08:00:00Z'), postNo: 1 },
      ],
    })
    const r = await createBooking(parse(), deps)
    expect(r.ok).toBe(false)
    if (!r.ok && 'conflict' in r) {
      expect(r.slots.some((s) => s.start === START)).toBe(false)
      expect(r.slots.length).toBeGreaterThan(0)
    }
    expect(deps.createBookingTx).not.toHaveBeenCalled()
    expect(deps.notify).not.toHaveBeenCalled()
  })

  it('DB 23P01 -> retries once with refreshed slots, then conflict', async () => {
    const tx = vi.fn(async () => {
      throw Object.assign(new Error('overlap'), { code: '23P01' })
    })
    const getBusy = vi.fn(async () => [] as Busy[])
    const deps = makeDeps({ createBookingTx: tx, getBusy })
    const r = await createBooking(parse(), deps)
    expect(r).toMatchObject({ ok: false, conflict: true })
    expect(tx).toHaveBeenCalledTimes(2)
    expect(getBusy.mock.calls.length).toBeGreaterThanOrEqual(2)
    expect(deps.notify).not.toHaveBeenCalled()
  })

  it('23P01 on first try, success on retry -> ok', async () => {
    const tx = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('overlap'), { code: '23P01' }))
      .mockResolvedValueOnce('booking-2')
    const r = await createBooking(parse(), makeDeps({ createBookingTx: tx }))
    expect(r).toEqual({ ok: true, id: 'booking-2' })
  })

  it('non-overlap DB errors propagate', async () => {
    const tx = vi.fn(async () => {
      throw new Error('boom')
    })
    await expect(createBooking(parse(), makeDeps({ createBookingTx: tx }))).rejects.toThrow('boom')
  })

  it('honeypot filled -> fake ok, no write, no notify', async () => {
    const deps = makeDeps()
    const r = await createBooking(parse({ website: 'http://spam' }), deps)
    expect(r.ok).toBe(true)
    expect(deps.createBookingTx).not.toHaveBeenCalled()
    expect(deps.notify).not.toHaveBeenCalled()
  })

  it('unknown service -> invalid', async () => {
    const r = await createBooking(parse(), makeDeps({ getService: async () => null }))
    expect(r).toMatchObject({ ok: false, invalid: true })
  })

  it('notify failure does not fail the booking', async () => {
    const deps = makeDeps({
      notify: vi.fn(async () => {
        throw new Error('telegram down')
      }),
    })
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await createBooking(parse(), deps)).toEqual({ ok: true, id: 'booking-1' })
    spy.mockRestore()
  })

  it('different phone formats are normalized to the same value', async () => {
    const deps = makeDeps()
    await createBooking(parse({ phone: '+38 (050) 111-22-33' }), deps)
    await createBooking(parse({ phone: '0501112233', start: '2026-10-14T09:00:00.000Z' }), deps)
    const phones = vi.mocked(deps.createBookingTx).mock.calls.map((c) => c[0].phone)
    expect(new Set(phones)).toEqual(new Set(['+380501112233']))
  })
})

describe('clientIp', () => {
  it('prefers x-vercel-forwarded-for over a spoofed leftmost XFF', () => {
    const h = new Headers({ 'x-forwarded-for': '6.6.6.6, 7.7.7.7', 'x-vercel-forwarded-for': '1.2.3.4' })
    expect(clientIp(h)).toBe('1.2.3.4')
  })
  it('uses x-real-ip next', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '6.6.6.6', 'x-real-ip': '5.5.5.5' }))).toBe('5.5.5.5')
  })
  it('falls back to the rightmost XFF hop, ignoring spoofed leftmost', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '6.6.6.6, 8.8.8.8' }))).toBe('8.8.8.8')
  })
  it('unknown without headers', () => {
    expect(clientIp(new Headers())).toBe('unknown')
  })
})

describe('handleSlotsGet validation and limits', () => {
  // now = 2026-10-01 00:00Z -> Kyiv today 2026-10-01, last allowed 2026-12-30
  const get = (date: string, deps = makeDeps()) =>
    handleSlotsGet({ serviceId: SERVICE, date }, '1.1.1.1', deps)
  it.each(['2026-99-99', '2026-02-31', '2026-10-00'])('rejects impossible date %s with 422', async (d) => {
    expect((await get(d)).status).toBe(422)
  })
  it('rejects past dates and dates beyond 90 days', async () => {
    expect((await get('2026-09-30')).status).toBe(422)
    expect((await get('2026-12-31')).status).toBe(422)
  })
  it('accepts today and the +90 day boundary', async () => {
    expect((await get('2026-10-01')).status).toBe(200)
    expect((await get('2026-12-30')).status).toBe(200)
  })
  it('returns 429 when rate limited', async () => {
    const r = await get('2026-10-14', makeDeps({ rateLimit: async () => false }))
    expect(r.status).toBe(429)
  })
})
