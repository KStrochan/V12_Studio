import { describe, expect, it } from 'vitest'
import { FALLBACK_CONTENT } from './content-fallback'
import { jsonLdScript, localBusinessJsonLd, resolveSiteUrl } from './jsonld'

const settings = { ...FALLBACK_CONTENT.settings, phone: '098 123 45 67' }

describe('localBusinessJsonLd', () => {
  const ld = localBusinessJsonLd(settings) as Record<string, any>

  it('is an AutoRepair with +380 phone and address', () => {
    expect(ld['@type']).toBe('AutoRepair')
    expect(ld.telephone).toBe('+380981234567')
    expect(ld.address.addressLocality).toBe('Стрий')
  })

  it('omits closed days from opening hours', () => {
    const specs = ld.openingHoursSpecification as { dayOfWeek: string[]; opens: string; closes: string }[]
    const all = specs.flatMap((s) => s.dayOfWeek)
    expect(all).not.toContain('Sunday')
    expect(all).toContain('Monday')
    expect(specs.find((s) => s.dayOfWeek.includes('Saturday'))).toMatchObject({ opens: '10:00', closes: '15:00' })
  })
})

describe('localBusinessJsonLd placeholders', () => {
  it('omits telephone and streetAddress for placeholder data', () => {
    const ld = localBusinessJsonLd({ ...FALLBACK_CONTENT.settings, phone: '+380 XX XXX XX XX', address: 'м. Стрий, вул. … ' }) as Record<string, any>
    expect(ld).not.toHaveProperty('telephone')
    expect(ld.address).not.toHaveProperty('streetAddress')
    expect(ld.address.addressLocality).toBe('Стрий')
  })
  it('omits telephone and streetAddress for empty strings', () => {
    const ld = localBusinessJsonLd({ ...FALLBACK_CONTENT.settings, phone: '', address: '' }) as Record<string, any>
    expect(ld).not.toHaveProperty('telephone')
    expect(ld.address).not.toHaveProperty('streetAddress')
  })
  it('includes real fallback phone, address, geo and hasMap', () => {
    const ld = localBusinessJsonLd(FALLBACK_CONTENT.settings) as Record<string, any>
    expect(ld.telephone).toBe('+380508280859')
    expect(ld.address.streetAddress).toBe('вулиця Клима Савури, 2б, Стрий, Львівська область, 82404')
    expect(ld.geo).toEqual({ '@type': 'GeoCoordinates', latitude: 49.2666809, longitude: 23.8763218 })
    expect(ld.hasMap).toBe('https://www.google.com/maps?cid=1261058270261688742')
  })
})

describe('jsonLdScript', () => {
  it('escapes < so content cannot close the script tag', () => {
    expect(jsonLdScript({ a: '</script><b>' })).not.toContain('<')
  })
})

describe('resolveSiteUrl', () => {
  it('uses the configured URL without trailing slash', () => {
    expect(resolveSiteUrl({ url: 'https://example.ua/', nodeEnv: 'production' })).toBe('https://example.ua')
  })
  it('is undefined in production when unset, localhost in dev', () => {
    expect(resolveSiteUrl({ nodeEnv: 'production' })).toBeUndefined()
    expect(resolveSiteUrl({ url: ' ', nodeEnv: 'production' })).toBeUndefined()
    expect(resolveSiteUrl({ nodeEnv: 'development' })).toBe('http://localhost:3000')
  })
})
