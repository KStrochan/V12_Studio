import { describe, it, expect } from 'vitest'
import { bookingInputSchema, consultationInputSchema } from './schemas'

const valid = {
  serviceId: '3f2b8c1e-5d4a-4b7e-9c1a-2e8f6a7b9d10',
  start: '2026-10-14T06:00:00.000Z',
  name: 'Іван',
  phone: '(067) 123-45-67',
  carMake: 'BMW',
  carModel: 'X5',
}

describe('bookingInputSchema', () => {
  it('accepts valid input, normalizes phone, allows empty comment', () => {
    const r = bookingInputSchema.safeParse({ ...valid, comment: '' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.phone).toBe('+380671234567')
  })
  it('rejects name of length 1', () => {
    expect(bookingInputSchema.safeParse({ ...valid, name: 'І' }).success).toBe(false)
  })
  it('rejects invalid phone', () => {
    expect(bookingInputSchema.safeParse({ ...valid, phone: '123' }).success).toBe(false)
  })
})

describe('consultationInputSchema', () => {
  it('accepts valid and honeypot', () => {
    const r = consultationInputSchema.safeParse({ name: 'Іван', phone: '0671234567', website: '' })
    expect(r.success).toBe(true)
  })
})
