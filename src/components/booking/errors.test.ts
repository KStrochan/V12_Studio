import { describe, expect, it } from 'vitest'
import { normalizeServerErrors } from './errors'

describe('normalizeServerErrors', () => {
  it('keeps field errors', () => {
    expect(normalizeServerErrors({ phone: 'Невірний номер телефону' })).toEqual({ phone: 'Невірний номер телефону' })
  })
  it('surfaces errors for non-rendered keys as a general message', () => {
    expect(normalizeServerErrors({ serviceId: 'Оберіть послугу' })).toEqual({ _: 'Оберіть послугу' })
  })
  it('uses a generic message when errors are missing', () => {
    expect(normalizeServerErrors(undefined)._).toMatch(/Не вдалося/)
    expect(normalizeServerErrors({})._).toMatch(/Не вдалося/)
  })
})
