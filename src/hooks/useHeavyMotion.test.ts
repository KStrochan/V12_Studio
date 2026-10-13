import { describe, expect, it } from 'vitest'
import { computeHeavyMotion } from './useHeavyMotion'

function env(opts: { reduced?: boolean; desktop?: boolean; cores?: number }) {
  return {
    matchMedia: (q: string) => ({
      matches: q.includes('prefers-reduced-motion') ? !!opts.reduced : !!opts.desktop,
    }),
    navigator: { hardwareConcurrency: opts.cores ?? 8 },
  }
}

describe('computeHeavyMotion', () => {
  it('is false with prefers-reduced-motion', () => {
    expect(computeHeavyMotion(env({ reduced: true, desktop: true }))).toBe(false)
  })
  it('is true on a capable desktop without reduced motion', () => {
    expect(computeHeavyMotion(env({ desktop: true }))).toBe(true)
  })
  it('is false on a 375px phone', () => {
    expect(computeHeavyMotion(env({ desktop: false }))).toBe(false)
  })
  it('is false with fewer than 4 cores', () => {
    expect(computeHeavyMotion(env({ desktop: true, cores: 2 }))).toBe(false)
  })
  it('is false without matchMedia', () => {
    expect(computeHeavyMotion({})).toBe(false)
  })
})
