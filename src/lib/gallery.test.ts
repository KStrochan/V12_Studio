import { describe, expect, it } from 'vitest'
import { swipeDirection, wrapIndex } from './gallery'

describe('wrapIndex', () => {
  it('wraps both ways', () => {
    expect(wrapIndex(6, 6)).toBe(0)
    expect(wrapIndex(-1, 6)).toBe(5)
    expect(wrapIndex(3, 6)).toBe(3)
  })
  it('handles empty list', () => expect(wrapIndex(2, 0)).toBe(0))
})

describe('swipeDirection', () => {
  it('detects left/right swipes', () => {
    expect(swipeDirection(-80, 5)).toBe(-1)
    expect(swipeDirection(80, 5)).toBe(1)
  })
  it('ignores short and mostly vertical drags', () => {
    expect(swipeDirection(20, 0)).toBe(0)
    expect(swipeDirection(60, 90)).toBe(0)
  })
})
