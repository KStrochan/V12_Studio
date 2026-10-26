import { describe, expect, it } from 'vitest'
import { beatOpacity, coverRect, frameAt, frameSrc, loadOrder, nearestLoaded, sectionProgress } from './scrollSequence'

describe('sectionProgress', () => {
  it('is 0 at the top and 1 at the end of the sticky travel', () => {
    expect(sectionProgress(0, 4000, 800)).toBe(0)
    expect(sectionProgress(-1600, 4000, 800)).toBe(0.5)
    expect(sectionProgress(-3200, 4000, 800)).toBe(1)
    expect(sectionProgress(-9999, 4000, 800)).toBe(1)
    expect(sectionProgress(300, 4000, 800)).toBe(0)
  })
  it('handles a section no taller than the viewport', () => {
    expect(sectionProgress(-10, 800, 800)).toBe(0)
  })
})

describe('frameAt / frameSrc', () => {
  it('maps progress to a frame index', () => {
    expect(frameAt(0, 120)).toBe(0)
    expect(frameAt(1, 120)).toBe(119)
    expect(frameAt(0.5, 121)).toBe(60)
    expect(frameAt(2, 10)).toBe(9)
    expect(frameAt(0.5, 1)).toBe(0)
  })
  it('builds 1-based zero-padded file names', () => {
    expect(frameSrc({ dir: '/hero-seq/desktop', count: 120, width: 1, height: 1 }, 0)).toBe('/hero-seq/desktop/f001.webp')
    expect(frameSrc({ dir: '/x', count: 120, width: 1, height: 1 }, 119)).toBe('/x/f120.webp')
  })
})

describe('loadOrder', () => {
  it('covers every frame exactly once, coarse pass first', () => {
    const o = loadOrder(30)
    expect(new Set(o).size).toBe(30)
    expect(o.slice(0, 4)).toEqual([0, 8, 16, 24])
    expect(o).toContain(29)
  })
  it('is empty for no frames', () => {
    expect(loadOrder(0)).toEqual([])
  })
})

describe('nearestLoaded', () => {
  it('finds the closest loaded frame in either direction', () => {
    const l = [true, false, false, false, true]
    expect(nearestLoaded(1, l)).toBe(0)
    expect(nearestLoaded(3, l)).toBe(4)
    expect(nearestLoaded(2, [false, false, false])).toBe(-1)
  })
})

describe('beatOpacity', () => {
  it('first beat is visible at the start, then fades', () => {
    expect(beatOpacity(0, 0, 0.2)).toBe(1)
    expect(beatOpacity(0.3, 0, 0.2)).toBe(0)
  })
  it('middle beat fades in and out', () => {
    expect(beatOpacity(0.1, 0.3, 0.5)).toBe(0)
    expect(beatOpacity(0.4, 0.3, 0.5)).toBe(1)
    expect(beatOpacity(0.3, 0.3, 0.5)).toBeCloseTo(0.5)
    expect(beatOpacity(0.7, 0.3, 0.5)).toBe(0)
  })
  it('last beat stays on at the end', () => {
    expect(beatOpacity(1, 0.8, 1)).toBe(1)
  })
})

describe('coverRect', () => {
  it('fills the box, cropping the overflow evenly', () => {
    expect(coverRect(1600, 900, 800, 900)).toEqual({ x: -400, y: 0, w: 1600, h: 900 })
    expect(coverRect(1600, 900, 1600, 900)).toEqual({ x: 0, y: 0, w: 1600, h: 900 })
  })
})
