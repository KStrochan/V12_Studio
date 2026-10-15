import { createClient } from '@supabase/supabase-js'
import { expect, test } from '@playwright/test'

// Against the real stack (needs Supabase env). Without it these are skipped:
// the same behaviour is covered on a real schema by tests/api/bookings.integration.test.ts (PGlite).
const hasEnv = Boolean(
  process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL,
)

const payload = (over: Record<string, unknown> = {}) => ({
  serviceId: '00000000-0000-4000-8000-000000000000',
  start: '2030-01-02T08:00:00.000Z',
  name: 'Бот Спам',
  phone: '050 111 22 33',
  carMake: 'Audi',
  carModel: 'A4',
  carYear: 2015,
  ...over,
})

const uniqueIp = () => `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`

test('honeypot: 201 but nothing is stored', async ({ request }) => {
  test.skip(!hasEnv, 'needs Supabase env (SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL)')
  const res = await request.post('/api/bookings', {
    data: payload({ website: 'http://spam.example' }),
    headers: { 'x-real-ip': uniqueIp() },
  })
  expect(res.status()).toBe(201)
  const { id } = await res.json()
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })
  const { data, error } = await db.from('bookings').select('id').eq('id', id)
  expect(error).toBeNull()
  expect(data).toHaveLength(0)
})

test('6th booking request from one IP within 10 minutes gets 429', async ({ request }) => {
  test.skip(!hasEnv, 'needs Supabase env (SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL)')
  const headers = { 'x-real-ip': uniqueIp() }
  const statuses: number[] = []
  // invalid phone: counts against the limit but never writes a booking
  for (let i = 0; i < 6; i++) {
    const res = await request.post('/api/bookings', { data: payload({ phone: '1' }), headers })
    statuses.push(res.status())
  }
  expect(statuses).toEqual([422, 422, 422, 422, 422, 429])
})
