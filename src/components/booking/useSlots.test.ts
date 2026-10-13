import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLatestGuard, fetchSlots, slotsErrorMessage } from './useSlots'

afterEach(() => vi.unstubAllGlobals())

describe('createLatestGuard', () => {
  it('only the latest ticket is current', () => {
    const g = createLatestGuard()
    const a = g.next()
    const b = g.next()
    expect(g.isCurrent(a)).toBe(false)
    expect(g.isCurrent(b)).toBe(true)
  })
})

describe('fetchSlots', () => {
  it('returns slots on 200', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ slots: [{ start: '2026-10-14T06:00:00.000Z', postNo: 1 }] }))))
    const r = await fetchSlots('s', '2026-10-14')
    expect(r.slots).toHaveLength(1)
    expect(r.error).toBeUndefined()
  })
  it('maps 429 and network errors to Ukrainian messages', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 429 })))
    expect((await fetchSlots('s', 'd')).error).toBe(slotsErrorMessage(429))
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('fail') }))
    expect((await fetchSlots('s', 'd')).error).toMatch(/зʼєднання/)
  })
  it('rethrows aborts', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new DOMException('x', 'AbortError') }))
    await expect(fetchSlots('s', 'd')).rejects.toThrow()
  })
})
