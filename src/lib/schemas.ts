import { z } from 'zod'
import { normalizeUaPhone } from './phone'

const name = z
  .string({ message: "Вкажіть ім'я" })
  .trim()
  .min(2, "Ім'я має містити щонайменше 2 символи")
  .max(60, "Ім'я занадто довге")

const phone = z
  .string({ message: 'Вкажіть номер телефону' })
  .transform((v, ctx) => {
    const n = normalizeUaPhone(v)
    if (!n) {
      ctx.addIssue({ code: 'custom', message: 'Невірний номер телефону' })
      return z.NEVER
    }
    return n
  })

const honeypot = z.string().optional()

export const bookingInputSchema = z.object({
  serviceId: z.string({ message: 'Оберіть послугу' }).uuid('Невірна послуга'),
  start: z.string({ message: 'Оберіть час' }).datetime({ message: 'Невірна дата й час' }),
  name,
  phone,
  carMake: z
    .string({ message: 'Вкажіть марку авто' })
    .trim()
    .min(1, 'Вкажіть марку авто')
    .max(40, 'Марка занадто довга'),
  carModel: z
    .string({ message: 'Вкажіть модель авто' })
    .trim()
    .min(1, 'Вкажіть модель авто')
    .max(40, 'Модель занадто довга'),
  comment: z.string().max(500, 'Коментар занадто довгий (до 500 символів)').optional(),
  website: honeypot,
})

export const consultationInputSchema = z.object({
  name,
  phone,
  question: z.string().max(500, 'Питання занадто довге (до 500 символів)').optional(),
  website: honeypot,
})

export type BookingInput = z.infer<typeof bookingInputSchema>
export type ConsultationInput = z.infer<typeof consultationInputSchema>
