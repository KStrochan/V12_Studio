import { describe, expect, it } from 'vitest'
import { swipeAction } from './admin-bookings-ui'

describe('swipeAction', () => {
  it('right swipe past the threshold confirms, left swipe only asks to reject', () => {
    expect(swipeAction(120)).toBe('confirm')
    expect(swipeAction(-120)).toBe('reject')
  })
  it('short drags do nothing', () => {
    expect(swipeAction(90)).toBeNull()
    expect(swipeAction(-90)).toBeNull()
    expect(swipeAction(0)).toBeNull()
  })
})
