import { expect, test } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
const live = Boolean(url && service && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

test('guest on /admin is redirected to login', async ({ page }) => {
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/admin\/login$/)
  await expect(page.getByRole('heading', { name: 'Адмінка V12' })).toBeVisible()
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
})

test('guest on a nested admin page is redirected', async ({ page }) => {
  await page.goto('/admin/bookings')
  await expect(page).toHaveURL(/\/admin\/login$/)
})

test('admin API rejects guests with 401', async ({ request }) => {
  const res = await request.get('/api/admin/me')
  expect(res.status()).toBe(401)
})

test('wrong password shows a generic Ukrainian error', async ({ page }) => {
  test.skip(!live, 'needs real Supabase env')
  await page.goto('/admin/login')
  await page.getByLabel('Email').fill('nobody@example.com')
  await page.getByLabel('Пароль').fill('wrong-password')
  await page.getByRole('button', { name: 'Увійти' }).click()
  await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toHaveText('Невірний email або пароль')
})

test('owner sees the overview', async ({ page }) => {
  test.skip(!live, 'needs real Supabase env')
  const email = `owner-${Date.now()}@example.com`
  const password = `Pw-${Date.now()}-x`
  const db = createClient(url as string, service as string, { auth: { persistSession: false } })
  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: 'owner' },
  })
  expect(error).toBeNull()
  try {
    await page.goto('/admin/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Пароль').fill(password)
    await page.getByRole('button', { name: 'Увійти' }).click()
    await expect(page).toHaveURL(/\/admin$/)
    await expect(page.getByRole('heading', { name: 'Огляд' })).toBeVisible()
    await expect(page.getByText('Нові заявки')).toBeVisible()
  } finally {
    if (data?.user) await db.auth.admin.deleteUser(data.user.id)
  }
})

test('login shows a Ukrainian config error when Supabase env is missing', async ({ page }) => {
  test.skip(Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL), 'env is configured')
  await page.goto('/admin/login')
  await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toContainText('Авторизація не налаштована')
})
