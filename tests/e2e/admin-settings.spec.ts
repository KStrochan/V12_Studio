import { expect, test } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
const live = Boolean(url && service && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const kyivDay = (offsetDays: number) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv', year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(Date.now() + offsetDays * 86_400_000),
  )

test('admin settings: service price shows on the public page; a day off empties slots; CSV export', async ({ page }) => {
  test.skip(!live, 'needs real Supabase env')
  const db = createClient(url as string, service as string, { auth: { persistSession: false } })
  const stamp = Date.now()
  const email = `owner-${stamp}@example.com`
  const password = `Pw-${stamp}-x`
  const { data: user, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: 'owner' },
  })
  expect(error).toBeNull()

  const title = `Тест-послуга ${stamp}`
  const { data: svc } = await db
    .from('services')
    .insert({ title, description: 'e2e', price_from: 111, duration_min: 30, sort_order: 9000 })
    .select('id')
    .single()
  const tomorrow = kyivDay(1)

  try {
    await page.goto('/admin/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Пароль').fill(password)
    await page.getByRole('button', { name: 'Увійти' }).click()
    await expect(page).toHaveURL(/\/admin$/)

    // change the price -> visible on the public page
    await page.goto('/admin/services')
    const card = page.locator(`[data-service-id="${svc!.id}"]`)
    await card.getByLabel('Ціна від, грн').fill('777')
    await card.getByRole('button', { name: 'Зберегти' }).click()
    await expect(card.getByRole('status')).toHaveText('Збережено')
    await page.goto('/')
    const pub = page.locator('li, article').filter({ hasText: title }).first()
    await expect(pub).toContainText('777')

    // day off tomorrow -> no slots
    await page.goto('/admin/settings')
    await page.getByLabel('Дата').fill(tomorrow)
    await page.getByRole('button', { name: 'Додати вихідний' }).click()
    await expect(page.locator(`[data-day="${tomorrow}"]`)).toBeVisible()
    const res = await page.request.get(`/api/slots?serviceId=${svc!.id}&date=${tomorrow}`)
    expect(res.status()).toBe(200)
    expect(((await res.json()) as { slots: unknown[] }).slots).toEqual([])

    // export is protected and returns CSV with BOM for the owner
    const csv = await page.request.get('/api/admin/export?type=clients')
    expect(csv.status()).toBe(200)
    expect(csv.headers()['content-type']).toContain('text/csv')
    expect((await csv.body())[0]).toBe(0xef)
    const bad = await page.request.get('/api/admin/export?type=nope')
    expect(bad.status()).toBe(422)
  } finally {
    await db.from('days_off').delete().eq('day', tomorrow)
    if (svc) await db.from('services').delete().eq('id', svc.id)
    if (user?.user) await db.auth.admin.deleteUser(user.user.id)
  }
})

test('admin export requires the owner', async ({ request }) => {
  const res = await request.get('/api/admin/export?type=bookings', { maxRedirects: 0 })
  expect([401, 403, 307, 308]).toContain(res.status())
})

test('admin mobile tab bar: no label overflows its tab', async ({ page }) => {
  test.skip(!live, 'needs real Supabase env (admin login)')
  const db = createClient(url as string, service as string, { auth: { persistSession: false } })
  const stamp = Date.now()
  const email = `owner-nav-${stamp}@example.com`
  const password = `Pw-${stamp}-x`
  const { data: user } = await db.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { role: 'owner' } })
  try {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/admin/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Пароль').fill(password)
    await page.getByRole('button', { name: 'Увійти' }).click()
    await expect(page).toHaveURL(/\/admin$/)
    const tabs = page.getByRole('navigation', { name: 'Розділи (мобільна панель)' }).getByRole('link')
    expect(await tabs.count()).toBeGreaterThanOrEqual(7)
    const over = await tabs.evaluateAll((els) =>
      els.filter((e) => e.scrollWidth > e.clientWidth || e.getBoundingClientRect().height < 44).map((e) => e.textContent),
    )
    expect(over).toEqual([])
  } finally {
    if (user?.user) await db.auth.admin.deleteUser(user.user.id)
  }
})
