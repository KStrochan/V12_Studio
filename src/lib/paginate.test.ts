import { describe, expect, it } from 'vitest'
import { EXPORT_TOO_LARGE, fetchAll } from './paginate'

const fake = (total: number) => (from: number, to: number) =>
  Promise.resolve({ data: Array.from({ length: Math.max(0, Math.min(to + 1, total) - from) }, (_, i) => from + i), error: null })

describe('fetchAll', () => {
  it('returns all 2500 rows across pages', async () => {
    const rows = await fetchAll(fake(2500))
    expect(rows).toHaveLength(2500)
    expect(rows[2499]).toBe(2499)
  })
  it('handles an exact page multiple and empty', async () => {
    expect(await fetchAll(fake(2000))).toHaveLength(2000)
    expect(await fetchAll(fake(0))).toEqual([])
  })
  it('throws past the cap', async () => {
    await expect(fetchAll(fake(5000), 1000, 3000)).rejects.toThrow(EXPORT_TOO_LARGE)
  })
  it('propagates query errors', async () => {
    await expect(fetchAll(() => Promise.resolve({ data: null, error: new Error('db') }))).rejects.toThrow('db')
  })
})
