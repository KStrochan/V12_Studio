import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ cacheLife: () => {}, cacheTag: () => {} }))

import { assembleContent, callHref, formatHours, isPlaceholderPhone, mergeSettings, phoneHref } from './content'
import { FALLBACK_CONTENT } from './content-fallback'
import { localBusinessJsonLd } from './jsonld'

describe('empty phone/address from the DB', () => {
  it('falls back to the real contacts for empty DB strings', () => {
    const m = mergeSettings({ phone: '', address: '', socials: {}, working_hours: {} })
    expect(m.phone).toBe(FALLBACK_CONTENT.settings.phone)
    expect(callHref(m.phone)).toBe('tel:+380508280859')
  })
  it('placeholder detection: empty and masked values are placeholders, real ones are not', () => {
    expect(isPlaceholderPhone('')).toBe(true)
    expect(isPlaceholderPhone('+380 XX XXX XX XX')).toBe(true)
    expect(callHref('')).toBeNull()
    expect(isPlaceholderPhone(FALLBACK_CONTENT.settings.phone)).toBe(false)
  })
})

describe('content helpers', () => {
  it('groups fallback hours', () => {
    expect(formatHours(FALLBACK_CONTENT.settings.working_hours)).toEqual([
      'Пн–Пт 09:00–18:00',
      'Сб 10:00–15:00',
      'Нд вихідний',
    ])
  })
  it('builds tel href', () => {
    expect(phoneHref('+380 67 123 45 67')).toBe('tel:+380671234567')
  })
  it('keeps fallback for null DB fields', () => {
    const m = mergeSettings({ phone: null, address: null, socials: null, working_hours: null })
    expect(m).toEqual(FALLBACK_CONTENT.settings)
    expect(formatHours(m.working_hours).length).toBeGreaterThan(0)
  })
  it('uses real DB values', () => {
    expect(mergeSettings({ phone: '+380671234567', address: 'вул. Тестова 1' }).phone).toBe('+380671234567')
  })
  it('empty services/reviews stay empty (not placeholders)', () => {
    const c = assembleContent({ data: null, error: null }, { data: [], error: null }, { data: [], error: null })
    expect(c.services).toEqual([])
    expect(c.reviews).toEqual([])
  })
  it('query error falls back to placeholders', () => {
    const c = assembleContent({ data: null, error: null }, { data: null, error: new Error('x') }, { data: [], error: null })
    expect(c).toEqual(FALLBACK_CONTENT)
  })
  it('hides call link for placeholder phone only', () => {
    expect(callHref('+380 XX XXX XX XX')).toBeNull()
    expect(callHref('+380671234567')).toBe('tel:+380671234567')
  })
})
