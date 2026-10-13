import { expect, test, type Page } from '@playwright/test'

test.use({ viewport: { width: 375, height: 812 } })

async function fill(page: Page, phone: string) {
  await page.goto('/')
  const form = page.getByRole('form', { name: 'Форма консультації' })
  await form.scrollIntoViewIfNeeded()
  await form.getByLabel("Ім'я").fill('Тест Клієнт')
  await form.getByLabel('Телефон').fill(phone)
  return form
}

test('consultation form shows success state (API mocked)', async ({ page }) => {
  let body: Record<string, unknown> | undefined
  await page.route('**/api/consultations', async (route) => {
    body = route.request().postDataJSON()
    await route.fulfill({ status: 201, json: { id: 'x' } })
  })
  const form = await fill(page, '098 123 45 67')
  await form.getByRole('button', { name: 'Передзвоніть мені' }).click()
  await expect(page.getByText('Дякуємо!')).toBeVisible()
  expect(body).toMatchObject({ name: 'Тест Клієнт', phone: '098 123 45 67' })
})

test('invalid phone shows a Ukrainian field error (API mocked)', async ({ page }) => {
  await page.route('**/api/consultations', (route) =>
    route.fulfill({ status: 422, json: { errors: { phone: 'Невірний номер телефону' } } }),
  )
  const form = await fill(page, '123')
  await form.getByRole('button', { name: 'Передзвоніть мені' }).click()
  await expect(form.getByText('Невірний номер телефону')).toBeVisible()
  await expect(form.getByLabel('Телефон')).toHaveAttribute('aria-invalid', 'true')
  await expect(form.getByLabel('Телефон')).toBeFocused()
})

test('real API rejects an invalid phone', async ({ page }) => {
  test.skip(!process.env.SUPABASE_SERVICE_ROLE_KEY, 'needs SUPABASE_SERVICE_ROLE_KEY')
  const form = await fill(page, '123')
  await form.getByRole('button', { name: 'Передзвоніть мені' }).click()
  await expect(form.getByText('Невірний номер телефону')).toBeVisible()
})

test('real API stores a valid consultation', async ({ page }) => {
  test.skip(!process.env.SUPABASE_SERVICE_ROLE_KEY, 'needs SUPABASE_SERVICE_ROLE_KEY')
  const form = await fill(page, '098 123 45 67')
  await form.getByRole('button', { name: 'Передзвоніть мені' }).click()
  await expect(page.getByText('Дякуємо!')).toBeVisible()
})
