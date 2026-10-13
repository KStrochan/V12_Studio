import { describe, expect, it } from 'vitest'
import {
  buildClientSearch,
  clientPatchSchema,
  consultationPatchSchema,
  dayOffSchema,
  reviewCreateSchema,
  serviceCreateSchema,
  servicePatchSchema,
  settingsSchema,
  uuidSchema,
} from './admin-schemas'

const hours = { open: '09:00', close: '18:00' }
const settings = {
  phone: '+380501234567',
  address: 'м. Стрий',
  socials: { instagram: 'https://instagram.com/v12' },
  working_hours: { '0': null, '1': hours, '2': hours, '3': hours, '4': hours, '5': hours, '6': null },
  posts: 2,
  step_min: 30,
  min_lead_min: 60,
}

describe('admin schemas', () => {
  it('validates uuid ids', () => {
    expect(uuidSchema.safeParse('nope').success).toBe(false)
    expect(uuidSchema.safeParse('3f2c7c1e-6f0e-4f55-9c47-0d5d8c1d9a11').success).toBe(true)
  })
  it('consultation status only new|handled', () => {
    expect(consultationPatchSchema.safeParse({ status: 'handled' }).success).toBe(true)
    expect(consultationPatchSchema.safeParse({ status: 'done' }).success).toBe(false)
    expect(consultationPatchSchema.safeParse({ status: 'new', name: 'x' }).success).toBe(false)
  })
  it('client notes capped and strict', () => {
    expect(clientPatchSchema.safeParse({ notes: 'ok' }).success).toBe(true)
    expect(clientPatchSchema.safeParse({ notes: 'x'.repeat(2001) }).success).toBe(false)
    expect(clientPatchSchema.safeParse({ notes: '', phone: '1' }).success).toBe(false)
  })
  it('service create/patch', () => {
    const ok = serviceCreateSchema.parse({ title: 'Діагностика', price_from: 500, duration_min: 60 })
    expect(ok).toMatchObject({ icon: 'wrench', active: true, sort_order: 0 })
    expect(serviceCreateSchema.safeParse({ title: 'Д', price_from: 1, duration_min: 60 }).success).toBe(false)
    expect(servicePatchSchema.safeParse({}).success).toBe(false)
    expect(servicePatchSchema.safeParse({ price_from: -1 }).success).toBe(false)
    expect(servicePatchSchema.safeParse({ price_from: 700.5 }).success).toBe(false)
    expect(servicePatchSchema.safeParse({ id: 'x', price_from: 700 }).success).toBe(false)
    expect(servicePatchSchema.safeParse({ price_from: 700, active: false }).success).toBe(true)
  })
  it('settings accept null = closed and https socials', () => {
    expect(settingsSchema.safeParse(settings).success).toBe(true)
  })
  it('settings reject http / javascript socials', () => {
    expect(settingsSchema.safeParse({ ...settings, socials: { instagram: 'http://x.com' } }).success).toBe(false)
    expect(settingsSchema.safeParse({ ...settings, socials: { instagram: 'javascript:alert(1)' } }).success).toBe(false)
  })
  it('settings reject bad hours and ranges', () => {
    const bad = { ...settings.working_hours, '1': { open: '18:00', close: '09:00' } }
    expect(settingsSchema.safeParse({ ...settings, working_hours: bad }).success).toBe(false)
    expect(settingsSchema.safeParse({ ...settings, posts: 0 }).success).toBe(false)
    expect(settingsSchema.safeParse({ ...settings, step_min: 0 }).success).toBe(false)
    expect(settingsSchema.safeParse({ ...settings, min_lead_min: -1 }).success).toBe(false)
    const missing: Record<string, unknown> = { ...settings.working_hours }
    delete missing['6']
    expect(settingsSchema.safeParse({ ...settings, working_hours: missing }).success).toBe(false)
  })
  it('day off date must be real', () => {
    expect(dayOffSchema.safeParse({ day: '2026-10-14' }).success).toBe(true)
    expect(dayOffSchema.safeParse({ day: '2026-02-30' }).success).toBe(false)
    expect(dayOffSchema.safeParse({ day: 'tomorrow' }).success).toBe(false)
  })
  it('review create', () => {
    expect(reviewCreateSchema.parse({ author: 'Іван', body: 'Дякую!', rating: 5 }).visible).toBe(true)
    expect(reviewCreateSchema.safeParse({ author: 'Іван', body: 'Дякую!', rating: 6 }).success).toBe(false)
  })
})

describe('buildClientSearch', () => {
  it('escapes LIKE wildcards', () => {
    expect(buildClientSearch('a%b_c\\').name).toBe('%a\\%b\\_c\\\\%')
  })
  it('extracts phone digits', () => {
    expect(buildClientSearch('+38 050').phone).toBe('%38050%')
    expect(buildClientSearch('Іван').phone).toBeNull()
  })
  it('empty query yields nothing', () => {
    expect(buildClientSearch('  ')).toEqual({ name: null, phone: null })
  })
})

describe('settings phone/address', () => {
  it('rejects empty or junk phone/address', () => {
    expect(settingsSchema.safeParse({ ...settings, phone: '' }).success).toBe(false)
    expect(settingsSchema.safeParse({ ...settings, phone: 'abc' }).success).toBe(false)
    expect(settingsSchema.safeParse({ ...settings, phone: '123' }).success).toBe(false)
    expect(settingsSchema.safeParse({ ...settings, address: '  ' }).success).toBe(false)
    expect(settingsSchema.safeParse({ ...settings, phone: '+38 (050) 123-45-67' }).success).toBe(true)
  })
})
