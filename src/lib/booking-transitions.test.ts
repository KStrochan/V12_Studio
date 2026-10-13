import { describe, expect, it } from 'vitest'
import { BOOKING_STATUSES, canTransition, type BookingStatus } from './booking-transitions'

const ALLOWED = new Set(['pending>confirmed', 'pending>rejected', 'pending>cancelled', 'confirmed>done', 'confirmed>cancelled'])

describe('canTransition', () => {
  for (const from of BOOKING_STATUSES) {
    for (const to of BOOKING_STATUSES) {
      const expected = ALLOWED.has(`${from}>${to}`)
      it(`${from} -> ${to} is ${expected ? 'allowed' : 'forbidden'}`, () => {
        expect(canTransition(from as BookingStatus, to as BookingStatus)).toBe(expected)
      })
    }
  }
  it('rejects unknown statuses', () => {
    expect(canTransition('bogus' as BookingStatus, 'done')).toBe(false)
  })
})
