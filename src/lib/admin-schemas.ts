import { z } from 'zod'

export const uuidSchema = z.string().uuid('Невірний ідентифікатор')

export const consultationPatchSchema = z
  .object({ status: z.enum(['new', 'handled'], { message: 'Невірний статус' }) })
  .strict()

export const clientPatchSchema = z
  .object({ notes: z.string({ message: 'Невірні нотатки' }).max(2000, 'Нотатки занадто довгі (до 2000 символів)') })
  .strict()

export const ICON_NAMES = ['scan', 'suspension', 'oil', 'engine', 'bolt', 'brake', 'body', 'tire', 'wrench'] as const

const serviceFields = {
  title: z.string({ message: 'Вкажіть назву' }).trim().min(2, 'Назва занадто коротка').max(80, 'Назва занадто довга'),
  description: z.string({ message: 'Невірний опис' }).trim().max(500, 'Опис занадто довгий (до 500 символів)'),
  price_from: z
    .number({ message: 'Невірна ціна' })
    .int('Ціна має бути цілим числом')
    .min(0, 'Ціна не може бути від’ємною')
    .max(1_000_000, 'Ціна занадто велика'),
  duration_min: z
    .number({ message: 'Невірна тривалість' })
    .int('Тривалість має бути цілим числом')
    .min(5, 'Мінімальна тривалість 5 хв')
    .max(1440, 'Максимальна тривалість 24 год'),
  icon: z.enum(ICON_NAMES, { message: 'Невірна іконка' }),
  sort_order: z.number({ message: 'Невірний порядок' }).int('Порядок має бути цілим числом').min(-9999).max(9999),
  active: z.boolean({ message: 'Невірна активність' }),
}

export const serviceCreateSchema = z
  .object({
    ...serviceFields,
    description: serviceFields.description.default(''),
    icon: serviceFields.icon.default('wrench'),
    sort_order: serviceFields.sort_order.default(0),
    active: serviceFields.active.default(true),
  })
  .strict()

export const servicePatchSchema = z
  .object(serviceFields)
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Немає змін')

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Час у форматі ГГ:ХХ')
const dayHours = z
  .object({ open: hhmm, close: hhmm })
  .strict()
  .refine((h) => h.close > h.open, 'Закриття має бути пізніше за відкриття')
  .nullable()

const httpsUrl = z
  .string()
  .trim()
  .max(200, 'Посилання занадто довге')
  .refine((v) => {
    try {
      return new URL(v).protocol === 'https:'
    } catch {
      return false
    }
  }, 'Посилання має починатися з https://')

export const settingsSchema = z
  .object({
    phone: z
      .string({ message: 'Невірний телефон' })
      .trim()
      .max(30, 'Телефон занадто довгий')
      .regex(/^\+?[\d\s().-]+$/, 'Невірний номер телефону')
      .refine((v) => v.replace(/\D/g, '').length >= 10, 'Невірний номер телефону'),
    address: z.string({ message: 'Невірна адреса' }).trim().min(1, 'Вкажіть адресу').max(200, 'Адреса занадто довга'),
    socials: z.record(z.string().regex(/^[a-z]{2,20}$/, 'Невірна назва мережі'), httpsUrl),
    working_hours: z
      .object({ '0': dayHours, '1': dayHours, '2': dayHours, '3': dayHours, '4': dayHours, '5': dayHours, '6': dayHours })
      .strict(),
    posts: z.number({ message: 'Невірна кількість постів' }).int().min(1, 'Мінімум 1 пост').max(20, 'Максимум 20 постів'),
    step_min: z.number({ message: 'Невірний крок' }).int().min(5, 'Мінімальний крок 5 хв').max(240, 'Максимальний крок 240 хв'),
    min_lead_min: z.number({ message: 'Невірний запас' }).int().min(0, 'Не може бути від’ємним').max(10_080, 'Максимум 7 днів'),
  })
  .strict()

const dayString = z
  .string({ message: 'Оберіть дату' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Невірна дата')
  .refine((d) => {
    const t = new Date(d + 'T00:00:00Z')
    return !Number.isNaN(t.getTime()) && t.toISOString().slice(0, 10) === d
  }, 'Невірна дата')

export const dayOffSchema = z
  .object({ day: dayString, reason: z.string().trim().max(100, 'Причина занадто довга').optional() })
  .strict()

export const dayParamSchema = dayString

export const reviewCreateSchema = z
  .object({
    author: z.string({ message: 'Вкажіть автора' }).trim().min(2, 'Ім’я занадто коротке').max(60, 'Ім’я занадто довге'),
    body: z.string({ message: 'Вкажіть текст' }).trim().min(2, 'Текст занадто короткий').max(1000, 'Текст занадто довгий'),
    rating: z.number({ message: 'Невірний рейтинг' }).int().min(1, 'Рейтинг від 1 до 5').max(5, 'Рейтинг від 1 до 5'),
    visible: z.boolean().default(true),
  })
  .strict()

export const reviewPatchSchema = z.object({ visible: z.boolean({ message: 'Невірне значення' }) }).strict()

export const exportTypeSchema = z.enum(['bookings', 'clients'], { message: 'Невірний тип експорту' })

/** Safe client search: LIKE wildcards are escaped and values go through .ilike(), never into a filter string. */
export function buildClientSearch(raw: string): { name: string | null; phone: string | null } {
  const q = raw.trim().slice(0, 40)
  if (!q) return { name: null, phone: null }
  const esc = (s: string) => s.replace(/[\\%_]/g, (c) => '\\' + c)
  const digits = q.replace(/\D/g, '')
  return { name: `%${esc(q)}%`, phone: digits.length >= 2 ? `%${digits}%` : null }
}

export function firstError(e: z.ZodError): string {
  return e.issues[0]?.message ?? 'Невірні дані'
}
