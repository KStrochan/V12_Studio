import { expect, test } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
const live = Boolean(url && service && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

test('admin consultations and clients: tel link, handled toggle, search, notes, visit history', async ({ page }) => {
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

  const phone = '+380509990077'
  const name = `Клієнт${stamp}`
  const { data: cons } = await db
    .from('consultations')
    .insert({ name: `Консульт${stamp}`, phone: '+380509990078', question: 'Стукіт у підвісці' })
    .select('id')
    .single()
  const { data: client } = await db
    .from('clients')
    .upsert({ phone, name, car: 'Test Car' }, { onConflict: 'phone' })
    .select('id')
    .single()
  const { data: svc } = await db.from('services').select('id').limit(1).single()
  const start = new Date(Date.now() + 20 * 86_400_000)
  const { data: booking } = await db
    .from('bookings')
    .insert({
      service_id: svc!.id,
      client_id: client!.id,
      start_at: start.toISOString(),
      end_at: new Date(start.getTime() + 30 * 60_000).toISOString(),
      post_no: 1,
      status: 'confirmed',
    })
    .select('id')
    .single()

  try {
    await page.goto('/admin/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Пароль').fill(password)
    await page.getByRole('button', { name: 'Увійти' }).click()
    await expect(page).toHaveURL(/\/admin$/)

    // consultation: tel: link + mark handled
    await page.goto('/admin/consultations')
    const card = page.getByTestId('consultation-card').filter({ hasText: `Консульт${stamp}` })
    await expect(card.locator('a[href^="tel:"]')).toHaveAttribute('href', 'tel:+380509990078')
    await expect(card).toHaveAttribute('data-status', 'new')
    await card.getByRole('button', { name: 'Опрацьовано' }).click()
    await expect(card).toHaveAttribute('data-status', 'handled')

    // search by part of phone and by part of name
    await page.goto('/admin/clients')
    await page.getByLabel('Пошук за іменем або телефоном').fill('99900')
    await page.getByRole('button', { name: 'Знайти' }).click()
    await expect(page.getByTestId('client-card').filter({ hasText: name })).toBeVisible()
    await page.getByLabel('Пошук за іменем або телефоном').fill(`ієнт${stamp}`)
    await page.getByRole('button', { name: 'Знайти' }).click()
    await expect(page.getByTestId('client-card').filter({ hasText: name })).toBeVisible()
    // LIKE wildcards are literal
    await page.getByLabel('Пошук за іменем або телефоном').fill('%%%')
    await page.getByRole('button', { name: 'Знайти' }).click()
    await expect(page.getByText('Нікого не знайдено.')).toBeVisible()

    // detail: notes persist, history built from bookings
    await page.goto(`/admin/clients/${client!.id}`)
    await expect(page.getByTestId('visit')).toHaveCount(1)
    await page.getByLabel('Нотатки власника').fill('Постійний клієнт, любить каву')
    await page.getByRole('button', { name: 'Зберегти' }).click()
    await expect(page.getByRole('status')).toHaveText('Збережено')
    await page.reload()
    await expect(page.getByLabel('Нотатки власника')).toHaveValue('Постійний клієнт, любить каву')
  } finally {
    if (booking) await db.from('bookings').delete().eq('id', booking.id)
    if (client) await db.from('clients').delete().eq('id', client.id)
    if (cons) await db.from('consultations').delete().eq('id', cons.id)
    if (user?.user) await db.auth.admin.deleteUser(user.user.id)
  }
})
