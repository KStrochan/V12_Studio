import { z } from 'zod'
import {
  BUSINESS_TZ,
  computeSlots,
  type Busy,
  type Slot,
  type WorkingHours,
} from './slots'
import { normalizeUaPhone } from './phone'
import {
  bookingInputSchema,
  consultationInputSchema,
  type BookingInput,
  type ConsultationInput,
} from './schemas'

export type ServiceInfo = { id: string; durationMin: number }
export type SettingsInfo = {
  hours: WorkingHours
  posts: number
  stepMin: number
  minLeadMin: number
}
export type BookingTxArgs = {
  serviceId: string
  start: string
  end: string
  postNo: number
  name: string
  phone: string
  carMake: string
  carModel: string
  comment: string | null
}
export type ConsultationRecord = { name: string; phone: string; question: string | null }
export type NotifyEvent =
  | { type: 'booking'; id: string; booking: BookingTxArgs }
  | { type: 'consultation'; id: string; consultation: ConsultationRecord }

/** DB-agnostic dependencies; the Supabase adapter lives in supabase/admin.ts. */
export type BookingDeps = {
  now(): Date
  getService(id: string): Promise<ServiceInfo | null>
  getSettings(): Promise<SettingsInfo>
  getDaysOff(): Promise<string[]>
  /** pending + confirmed bookings overlapping [from, to) */
  getBusy(from: Date, to: Date): Promise<Busy[]>
  /** Calls create_booking_tx; must let SQLSTATE 23P01 propagate (error.code). */
  createBookingTx(args: BookingTxArgs): Promise<string>
  notify?(event: NotifyEvent): Promise<void>
  rateLimit?(key: string, max: number, windowSec: number): Promise<boolean>
  insertConsultation?(c: ConsultationRecord): Promise<string>
}

export type CreateBookingResult =
  | { ok: true; id: string }
  | { ok: false; conflict: true; slots: Slot[] }
  | { ok: false; invalid: true; message: string }

const DAY = 86_400_000
const MAX_DAYS_AHEAD = 90
const WINDOW_MESSAGE = 'Оберіть дату в межах найближчих 90 днів'

export function kyivDate(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

/** Last bookable Kyiv date (today + 90 days), shared by /api/slots and /api/bookings. */
function lastBookableDate(now: Date): string {
  const today = kyivDate(now)
  return new Date(Date.parse(`${today}T00:00:00Z`) + MAX_DAYS_AHEAD * DAY).toISOString().slice(0, 10)
}

async function slotsFor(
  deps: BookingDeps,
  service: ServiceInfo,
  settings: SettingsInfo,
  date: string,
): Promise<Slot[]> {
  const base = Date.parse(`${date}T00:00:00Z`)
  const [daysOff, busy] = await Promise.all([
    deps.getDaysOff(),
    deps.getBusy(new Date(base - DAY), new Date(base + 2 * DAY)),
  ])
  return computeSlots({
    date,
    durationMin: service.durationMin,
    hours: settings.hours,
    posts: settings.posts,
    stepMin: settings.stepMin,
    minLeadMin: settings.minLeadMin,
    now: deps.now(),
    daysOff,
    busy,
  })
}

export async function getAvailableSlots(
  serviceId: string,
  date: string,
  deps: BookingDeps,
): Promise<Slot[] | null> {
  const service = await deps.getService(serviceId)
  if (!service) return null
  const settings = await deps.getSettings()
  return slotsFor(deps, service, settings, date)
}

const isOverlap = (e: unknown) =>
  typeof e === 'object' && e !== null && (e as { code?: unknown }).code === '23P01'

async function safeNotify(deps: BookingDeps, event: NotifyEvent) {
  try {
    await deps.notify?.(event)
  } catch (e) {
    console.error('notify failed', e)
  }
}

export async function createBooking(
  input: BookingInput,
  deps: BookingDeps,
): Promise<CreateBookingResult> {
  // Honeypot: pretend success, store nothing, notify nobody.
  if (input.website) return { ok: true, id: crypto.randomUUID() }

  const phone = normalizeUaPhone(input.phone)
  if (!phone) return { ok: false, invalid: true, message: 'Невірний номер телефону' }

  const service = await deps.getService(input.serviceId)
  if (!service) return { ok: false, invalid: true, message: 'Послугу не знайдено' }
  const settings = await deps.getSettings()
  const startMs = Date.parse(input.start)
  const start = new Date(startMs)
  const end = new Date(startMs + service.durationMin * 60_000)
  const date = kyivDate(start)
  if (date > lastBookableDate(deps.now())) {
    return { ok: false, invalid: true, message: WINDOW_MESSAGE }
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    const slots = await slotsFor(deps, service, settings, date)
    const slot = slots.find((s) => Date.parse(s.start) === startMs)
    if (!slot || slot.postNo > settings.posts) return { ok: false, conflict: true, slots }

    const args: BookingTxArgs = {
      serviceId: service.id,
      start: start.toISOString(),
      end: end.toISOString(),
      postNo: slot.postNo,
      name: input.name,
      phone,
      carMake: input.carMake,
      carModel: input.carModel,
      comment: input.comment?.trim() ? input.comment.trim() : null,
    }
    try {
      const id = await deps.createBookingTx(args)
      await safeNotify(deps, { type: 'booking', id, booking: args })
      return { ok: true, id }
    } catch (e) {
      if (!isOverlap(e)) throw e
      // lost the race: loop once more with a refreshed busy list
    }
  }
  const slots = await slotsFor(deps, service, settings, date)
  return { ok: false, conflict: true, slots }
}

// ---- HTTP-level handlers (framework-agnostic, used by route files) ----

export type HttpResult = { status: number; body: unknown }

function zodErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? '_')
    if (!(key in out)) out[key] = issue.message
  }
  return out
}

const TOO_MANY = { error: 'Забагато запитів. Спробуйте пізніше.' }

/**
 * Client IP for rate limiting. Deployment assumption: Vercel. Vercel sets
 * `x-vercel-forwarded-for` (and `x-real-ip`) itself and overwrites any
 * client-supplied value, so those are trusted first. The leftmost
 * x-forwarded-for entry is attacker-controlled and must never be used; as a
 * fallback take the rightmost hop, which was appended by the nearest proxy.
 */
export function clientIp(headers: Headers): string {
  const direct = headers.get('x-vercel-forwarded-for') ?? headers.get('x-real-ip')
  if (direct?.trim()) return direct.split(',')[0].trim()
  const hops = headers.get('x-forwarded-for')?.split(',').map((h) => h.trim()).filter(Boolean)
  return hops?.length ? hops[hops.length - 1] : 'unknown'
}

function isRealDate(date: string): boolean {
  const d = new Date(`${date}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === date
}

export async function handleSlotsGet(
  params: { serviceId: string | null; date: string | null },
  ip: string,
  deps: BookingDeps,
): Promise<HttpResult> {
  if (deps.rateLimit && !(await deps.rateLimit(`slots:${ip}`, 60, 60))) {
    return { status: 429, body: TOO_MANY }
  }
  const parsed = z
    .object({
      serviceId: z.string().uuid('Невірна послуга'),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Невірна дата'),
    })
    .safeParse(params)
  if (!parsed.success) return { status: 422, body: { errors: zodErrors(parsed.error) } }
  const { date } = parsed.data
  if (!isRealDate(date) || date < kyivDate(deps.now()) || date > lastBookableDate(deps.now())) {
    return { status: 422, body: { errors: { date: WINDOW_MESSAGE } } }
  }
  const slots = await getAvailableSlots(parsed.data.serviceId, parsed.data.date, deps)
  if (!slots) return { status: 422, body: { errors: { serviceId: 'Послугу не знайдено' } } }
  return { status: 200, body: { slots } }
}

export async function handleBookingPost(
  json: unknown,
  ip: string,
  deps: BookingDeps,
): Promise<HttpResult> {
  if (deps.rateLimit && !(await deps.rateLimit(`booking:${ip}`, 5, 600))) {
    return { status: 429, body: TOO_MANY }
  }
  const parsed = bookingInputSchema.safeParse(json)
  if (!parsed.success) return { status: 422, body: { errors: zodErrors(parsed.error) } }
  const r = await createBooking(parsed.data, deps)
  if (r.ok) return { status: 201, body: { id: r.id } }
  if ('conflict' in r) {
    return {
      status: 409,
      body: { error: 'Цей час щойно зайняли. Оберіть інший.', slots: r.slots },
    }
  }
  return { status: 422, body: { errors: { serviceId: r.message } } }
}

export async function handleConsultationPost(
  json: unknown,
  ip: string,
  deps: BookingDeps,
): Promise<HttpResult> {
  if (deps.rateLimit && !(await deps.rateLimit(`consultation:${ip}`, 5, 600))) {
    return { status: 429, body: TOO_MANY }
  }
  const parsed = consultationInputSchema.safeParse(json)
  if (!parsed.success) return { status: 422, body: { errors: zodErrors(parsed.error) } }
  const input: ConsultationInput = parsed.data
  if (input.website) return { status: 201, body: { id: crypto.randomUUID() } }
  if (!deps.insertConsultation) throw new Error('insertConsultation dep missing')
  const c: ConsultationRecord = {
    name: input.name,
    phone: input.phone,
    question: input.question?.trim() ? input.question.trim() : null,
  }
  const id = await deps.insertConsultation(c)
  await safeNotify(deps, { type: 'consultation', id, consultation: c })
  return { status: 201, body: { id } }
}
