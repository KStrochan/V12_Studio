import { expect, test } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { TZDate } from '@date-fns/tz'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
const live = Boolean(url && service && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

/** Kyiv wall time on the first Wednesday at least 10 days ahead. */
function kyivSlot(hour: number) {
  const d = new Date(Date.now() + 10 * 86_400_000)
  while (d.getUTCDay() !== 3) d.setUTCDate(d.getUTCDate() + 1)
  const t = new TZDate(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hour, 0, 0, 'Europe/Kyiv')
  return new Date(t.getTime())
}

test('admin bookings: confirm a pending booking; moving onto a busy slot shows an error', async ({ page }) => {
  test.skip(!live, 'needs real Supabase env')
  const db = createClient(url as string, service as string, { auth: { persistSession: false } })
  const email = `owner-${Date.now()}@example.com`
  const password = `Pw-${Date.now()}-x`
  const { data: user, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: 'owner' },
  })
  expect(error).toBeNull()

  const { data: svc } = await db.from('services').select('id,duration_min').eq('active', true).limit(1).single()
  const { data: client } = await db
    .from('clients')
    .upsert({ phone: '+380500000011', name: 'E2E Клієнт', car: 'Test Car' }, { onConflict: 'phone' })
    .select('id')
    .single()
  const mk = (hour: number, status: string) => {
    const start = kyivSlot(hour)
    return {
      service_id: svc!.id,
      client_id: client!.id,
      start_at: start.toISOString(),
      end_at: new Date(start.getTime() + 30 * 60_000).toISOString(),
      post_no: 1,
      status,
    }
  }
  const { data: rows, error: insErr } = await db
    .from('bookings')
    .insert([mk(10, 'confirmed'), mk(12, 'pending')])
    .select('id,status')
  expect(insErr).toBeNull()
  const pending = rows!.find((r) => r.status === 'pending')!

  try {
    await page.goto('/admin/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Пароль').fill(password)
    await page.getByRole('button', { name: 'Увійти' }).click()
    await expect(page).toHaveURL(/\/admin$/)
    await page.goto('/admin/bookings')

    // confirm via the visible button
    const card = page.locator(`[data-booking-id="${pending.id}"]`)
    await expect(card.locator('[data-status="pending"]').first()).toBeVisible()
    await card.getByRole('button', { name: 'Підтвердити' }).click()
    await expect(card).toHaveAttribute('data-status', 'confirmed')
    await expect(card.getByText('Підтверджено')).toBeVisible()

    // reschedule onto the occupied 10:00 slot on the same post -> error, nothing changes
    await card.getByRole('button', { name: 'Перенести' }).click()
    const dialog = page.getByRole('dialog', { name: 'Перенести запис' })
    await dialog.getByLabel('Час').fill('10:00')
    await dialog.getByRole('button', { name: 'Перенести', exact: true }).click()
    await expect(dialog.getByRole('alert')).toContainText('зайнятий')
    const after = await db.from('bookings').select('start_at').eq('id', pending.id).single()
    expect(Date.parse(after.data!.start_at)).toBe(Date.parse(mk(12, 'pending').start_at))
  } finally {
    await db.from('bookings').delete().in('id', rows!.map((r) => r.id))
    if (user?.user) await db.auth.admin.deleteUser(user.user.id)
  }
})
