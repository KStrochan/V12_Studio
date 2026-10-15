import { expect, test, type Page } from '@playwright/test'

const slotsFor = (date: string) => [
  { start: `${date}T07:00:00.000Z`, postNo: 1 },
  { start: `${date}T08:00:00.000Z`, postNo: 1 },
  { start: `${date}T09:00:00.000Z`, postNo: 2 },
]

async function mockSlots(page: Page) {
  await page.route('**/api/slots**', async (route) => {
    const date = new URL(route.request().url()).searchParams.get('date')!
    await route.fulfill({ status: 200, json: { slots: slotsFor(date) } })
  })
}

async function hideDevOverlay(page: Page) {
  // the Next dev indicator floats over the sticky bottom bar and intercepts pointer events
  await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' })
}

async function toSlotStep(page: Page) {
  await page.goto('/')
  await hideDevOverlay(page)
  const section = page.locator('#booking')
  await section.scrollIntoViewIfNeeded()
  await section.getByRole('radio', { name: /Діагностика/ }).click()
  await section.getByRole('button', { name: 'Далі' }).click()
  await expect(section.getByRole('heading', { name: /Дата й час/ })).toBeFocused()
  await section.locator('[role=radio][data-date]:not([disabled])').first().click()
  const slotGroup = section.getByRole('radiogroup', { name: 'Вільний час' })
  await expect(slotGroup).toBeVisible()
  return { section, slotGroup }
}

async function fillContacts(page: Page) {
  const form = page.locator('#booking-form')
  await form.getByLabel("Ім'я").fill('Тест Клієнт')
  await form.getByLabel('Телефон').fill('098 123 45 67')
  await form.getByLabel('Марка авто').fill('BMW')
  await form.getByLabel('Модель').fill('X5')
  await form.getByLabel('Рік випуску').selectOption('2015')
}

test('booking wizard: three steps to success (API mocked)', async ({ page }, info) => {
  await mockSlots(page)
  let body: Record<string, unknown> | undefined
  await page.route('**/api/bookings', async (route) => {
    body = route.request().postDataJSON()
    await route.fulfill({ status: 201, json: { id: 'b1' } })
  })
  const { section, slotGroup } = await toSlotStep(page)
  await slotGroup.getByRole('radio').nth(1).click()
  const desktop = (page.viewportSize()?.width ?? 0) >= 1024
  if (desktop) {
    const summary = page.getByTestId('booking-summary')
    await expect(summary).toBeVisible()
    await expect(summary).toContainText('Діагностика')
  } else {
    await expect(page.getByTestId('booking-summary')).toBeHidden()
    // sticky bottom action bar stays inside the viewport and tap targets are >= 44px
    const box = await section.getByRole('button', { name: 'Далі' }).boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(44)
    expect(box!.y + box!.height).toBeLessThanOrEqual(812)
  }
  await section.getByRole('button', { name: 'Далі' }).click()
  await fillContacts(page)
  await section.getByRole('button', { name: 'Надіслати запит' }).click()
  await expect(page.getByText('Запит надіслано, очікуйте підтвердження')).toBeVisible()
  expect(body).toMatchObject({ serviceId: 'diagnostics', name: 'Тест Клієнт', phone: '098 123 45 67', carMake: 'BMW', carModel: 'X5', carYear: 2015 })
  expect(String(body!.start)).toMatch(/T08:00:00/)
  void info
})

test('booking wizard: car year is required, listed descending from the current year to 1980', async ({ page }) => {
  await mockSlots(page)
  let posted = false
  await page.route('**/api/bookings', async (route) => {
    posted = true
    await route.fulfill({ status: 201, json: { id: 'b1' } })
  })
  const { section, slotGroup } = await toSlotStep(page)
  await slotGroup.getByRole('radio').first().click()
  await section.getByRole('button', { name: 'Далі' }).click()
  const form = page.locator('#booking-form')
  await form.getByLabel("Ім'я").fill('Тест Клієнт')
  await form.getByLabel('Телефон').fill('098 123 45 67')
  await form.getByLabel('Марка авто').fill('BMW')
  await form.getByLabel('Модель').fill('X5')
  const year = form.getByLabel('Рік випуску')
  const values = await year.locator('option').evaluateAll((o) => o.map((x) => (x as HTMLOptionElement).value).filter(Boolean))
  expect(values[values.length - 1]).toBe('1980')
  expect(Number(values[0])).toBeGreaterThanOrEqual(new Date().getFullYear() - 1)
  expect(values).toEqual([...values].sort((a, b) => Number(b) - Number(a)))
  const box = await year.boundingBox()
  expect(box!.height).toBeGreaterThanOrEqual(44)
  expect(await year.evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(16)
  await section.getByRole('button', { name: 'Надіслати запит' }).click()
  await expect(form.getByText('Вкажіть рік випуску авто')).toBeVisible()
  await expect(year).toBeFocused()
  expect(posted).toBe(false)
})

test('booking wizard: add-to-calendar buttons on the success screen (API mocked)', async ({ page }) => {
  await mockSlots(page)
  await page.route('**/api/bookings', (route) => route.fulfill({ status: 201, json: { id: 'b-cal-1' } }))
  const { section, slotGroup } = await toSlotStep(page)
  await slotGroup.getByRole('radio').first().click() // 07:00Z
  await section.getByRole('button', { name: 'Далі' }).click()
  await fillContacts(page)
  await section.getByRole('button', { name: 'Надіслати запит' }).click()
  await expect(page.getByText('Запит надіслано, очікуйте підтвердження')).toBeVisible()

  const google = section.getByRole('link', { name: 'Додати в Google Календар' })
  const ics = section.getByRole('button', { name: 'Завантажити в календар (.ics)' })
  await expect(google).toBeVisible()
  await expect(ics).toBeVisible()
  expect((await google.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  expect((await ics.boundingBox())!.height).toBeGreaterThanOrEqual(44)

  await expect(google).toHaveAttribute('target', '_blank')
  await expect(google).toHaveAttribute('rel', 'noopener noreferrer')
  const href = new URL((await google.getAttribute('href'))!)
  expect(href.origin + href.pathname).toBe('https://calendar.google.com/calendar/render')
  expect(href.searchParams.get('action')).toBe('TEMPLATE')
  expect(href.searchParams.get('text')).toBe('V12 Service: Діагностика')
  expect(href.searchParams.get('dates')).toMatch(/^\d{8}T070000Z\/\d{8}T\d{6}Z$/)
  expect(href.searchParams.get('details')).toContain('Запис очікує підтвердження')

  const [download] = await Promise.all([page.waitForEvent('download'), ics.click()])
  expect(download.suggestedFilename()).toMatch(/\.ics$/)
  const path = await download.path()
  const text = (await import('node:fs')).readFileSync(path, 'utf8')
  expect(text).toContain('BEGIN:VCALENDAR')
  expect(text).toContain('UID:b-cal-1@v12-service')
  expect(text).toContain('DTSTART:')
  expect(text).toContain('TRIGGER:-PT1H')
})

test('booking wizard: 409 shows conflict and fresh slots (API mocked)', async ({ page }) => {
  await mockSlots(page)
  await page.route('**/api/bookings', async (route) => {
    const start = String(route.request().postDataJSON().start)
    const date = start.slice(0, 10)
    await route.fulfill({ status: 409, json: { slots: [{ start: `${date}T09:00:00.000Z`, postNo: 2 }] } })
  })
  const { section, slotGroup } = await toSlotStep(page)
  await slotGroup.getByRole('radio').first().click()
  await section.getByRole('button', { name: 'Далі' }).click()
  await fillContacts(page)
  await section.getByRole('button', { name: 'Надіслати запит' }).click()
  await expect(section.getByText('Цей час щойно зайняли').first()).toBeVisible()
  await expect(section.getByRole('radiogroup', { name: 'Вільний час' }).getByRole('radio')).toHaveCount(1)
  // contacts are kept
  await section.getByRole('radiogroup', { name: 'Вільний час' }).getByRole('radio').click()
  await section.getByRole('button', { name: 'Далі' }).click()
  await expect(page.locator('#booking-form').getByLabel("Ім'я")).toHaveValue('Тест Клієнт')
})

test('booking wizard: empty day shows the empty state (API mocked)', async ({ page }) => {
  await page.route('**/api/slots**', (route) => route.fulfill({ status: 200, json: { slots: [] } }))
  await page.goto('/')
  await hideDevOverlay(page)
  const section = page.locator('#booking')
  await section.getByRole('radio', { name: /Діагностика/ }).click()
  await section.getByRole('button', { name: 'Далі' }).click()
  await section.locator('[role=radio][data-date]:not([disabled])').first().click()
  await expect(section.getByText('На цей день вільних місць немає')).toBeVisible()
})

test('booking wizard: 429 keeps user input (API mocked)', async ({ page }) => {
  await mockSlots(page)
  await page.route('**/api/bookings', (route) => route.fulfill({ status: 429, json: { error: 'rate' } }))
  const { section, slotGroup } = await toSlotStep(page)
  await slotGroup.getByRole('radio').first().click()
  await section.getByRole('button', { name: 'Далі' }).click()
  await fillContacts(page)
  await section.getByRole('button', { name: 'Надіслати запит' }).click()
  await expect(section.getByText(/Забагато спроб/)).toBeVisible()
  await expect(page.locator('#booking-form').getByLabel('Марка авто')).toHaveValue('BMW')
})

test('real API: slots endpoint responds for a service', async ({ page }) => {
  test.skip(!process.env.SUPABASE_SERVICE_ROLE_KEY, 'needs SUPABASE_SERVICE_ROLE_KEY')
  await page.goto('/')
  await hideDevOverlay(page)
  const section = page.locator('#booking')
  await section.getByRole('radio').first().click()
  await section.getByRole('button', { name: 'Далі' }).click()
  const first = section.locator('[role=radio][data-date]:not([disabled])').first()
  const res = page.waitForResponse('**/api/slots**')
  await first.click()
  expect((await res).status()).toBe(200)
})

test('mobile: sticky bar only while #booking is on screen, FloatingCta otherwise', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 1024, 'mobile only')
  await page.goto('/')
  await hideDevOverlay(page)
  const bar = page.locator('#booking').getByRole('button', { name: 'Далі' })
  const cta = page.locator('[data-floating-cta]')
  await expect(cta).toBeVisible()
  await expect(bar).toBeHidden()
  await page.locator('#booking').scrollIntoViewIfNeeded()
  await expect(bar).toBeVisible()
  await expect(cta).toBeHidden()
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await expect(bar).toBeHidden()
  await expect(cta).toBeVisible()
})

test('422 with unrendered field keys shows a focused general message (API mocked)', async ({ page }) => {
  await mockSlots(page)
  await page.route('**/api/bookings', (route) => route.fulfill({ status: 422, json: { errors: { serviceId: 'Оберіть послугу' } } }))
  const { section, slotGroup } = await toSlotStep(page)
  await slotGroup.getByRole('radio').first().click()
  await section.getByRole('button', { name: 'Далі' }).click()
  await fillContacts(page)
  await section.getByRole('button', { name: 'Надіслати запит' }).click()
  const msg = page.locator('#booking-general-err')
  await expect(msg).toHaveText('Оберіть послугу')
  await expect(msg).toBeFocused()
})

test('arrow keys in the day strip move focus without requesting slots', async ({ page }) => {
  await mockSlots(page)
  await page.goto('/')
  await hideDevOverlay(page)
  const section = page.locator('#booking')
  await section.getByRole('radio', { name: /Діагностика/ }).click()
  await section.getByRole('button', { name: 'Далі' }).click()
  const days = section.locator('[role=radio][data-date]:not([disabled])')
  await days.first().click()
  await expect(section.getByRole('radiogroup', { name: 'Вільний час' })).toBeVisible()
  let requests = 0
  page.on('request', (r) => { if (r.url().includes('/api/slots')) requests++ })
  await days.first().focus()
  await page.keyboard.press('ArrowRight')
  await expect(days.nth(1)).toBeFocused()
  await expect(days.first()).toHaveAttribute('aria-checked', 'true')
  expect(requests).toBe(0)
  await page.keyboard.press('Space')
  await expect(days.nth(1)).toHaveAttribute('aria-checked', 'true')
})

test('409 without slots refetches the list and notice clears on re-pick (API mocked)', async ({ page }) => {
  await mockSlots(page)
  await page.route('**/api/bookings', (route) => route.fulfill({ status: 409, json: {} }))
  const { section, slotGroup } = await toSlotStep(page)
  await slotGroup.getByRole('radio').first().click()
  await section.getByRole('button', { name: 'Далі' }).click()
  await fillContacts(page)
  await section.getByRole('button', { name: 'Надіслати запит' }).click()
  await expect(section.getByText(/Цей час щойно зайняли\. Оберіть/)).toBeVisible()
  const group = section.getByRole('radiogroup', { name: 'Вільний час' })
  await expect(group.getByRole('radio')).toHaveCount(3)
  await group.getByRole('radio').nth(1).click()
  await expect(section.getByText(/Цей час щойно зайняли\. Оберіть/)).toBeHidden()
})
