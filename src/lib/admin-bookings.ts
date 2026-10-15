import { z } from 'zod'
import { computeSlots, BUSINESS_TZ, type Busy } from './slots'
import { normalizeUaPhone } from './phone'
import { bookingInputSchema, carYearSchema } from './schemas'
import type { ServiceInfo, SettingsInfo } from './booking-service'
import { canTransition, BOOKING_STATUSES, type BookingStatus } from './booking-transitions'

export type BookingRow = {
  id: string
  status: BookingStatus
  start: Date
  end: Date
  postNo: number
}

export type ManualBookingArgs = {
  serviceId: string
  start: string
  end: string
  postNo: number
  name: string
  phone: string
  carMake: string
  carModel: string
  carYear: number | null
  comment: string | null
}

/** DB-agnostic deps; the Supabase (session client) adapter is in supabase/admin-bookings.ts. */
export type AdminBookingDeps = {
  now(): Date
  getBooking(id: string): Promise<BookingRow | null>
  getService(id: string): Promise<ServiceInfo | null>
  getSettings(): Promise<SettingsInfo>
  getDaysOff(): Promise<string[]>
  /** pending + confirmed bookings overlapping [from, to) */
  getBusy(from: Date, to: Date): Promise<(Busy & { id?: string })[]>
  /** Compare-and-set: true when a row with `from` status was updated. */
  setStatus(id: string, from: BookingStatus, to: BookingStatus): Promise<boolean>
  /** true when the (active) booking was found and updated. Must let 23P01 propagate. */
  reschedule(id: string, start: string, end: string, postNo: number): Promise<boolean>
  /** Must let 23P01 propagate (error.code). */
  createManual(args: ManualBookingArgs): Promise<string>
}

export type HttpResult = { status: number; body: unknown }

const CONFLICT = { error: 'Цей час зайнятий. Оберіть інший.' }
const NOT_FOUND = { error: 'Запис не знайдено' }
const DAY = 86_400_000
/** Owner may book at any 5-minute mark inside working hours (walk-ins). */
const ADMIN_STEP_MIN = 5
const GRACE_MS = 15 * 60_000

const isOverlap = (e: unknown) =>
  typeof e === 'object' && e !== null && (e as { code?: unknown }).code === '23P01'

const uuid = z.string().uuid('Невірний ідентифікатор')
const postNo = z.number({ message: 'Невірний пост' }).int('Невірний пост').min(1, 'Невірний пост')

export const patchSchema = z.union([
  z
    .object({
      status: z.enum(BOOKING_STATUSES as [BookingStatus, ...BookingStatus[]], {
        message: 'Невірний статус',
      }),
    })
    .strict(),
  z
    .object({
      start: z.string({ message: 'Оберіть час' }).datetime({ message: 'Невірна дата й час' }),
      postNo: postNo.optional(),
    })
    .strict(),
])

export const manualSchema = bookingInputSchema
  .pick({ serviceId: true, start: true, name: true, phone: true, comment: true })
  .extend({
    carMake: z.string().trim().max(40, 'Марка занадто довга').default(''),
    carModel: z.string().trim().max(40, 'Модель занадто довга').default(''),
    carYear: carYearSchema.optional(),
    postNo: postNo.optional(),
  })

function zodErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? '_')
    if (!(key in out)) out[key] = issue.message
  }
  return out
}

type Placement = { ok: true; postNo: number } | { ok: false; res: HttpResult }

/**
 * Same rules as the public slot logic (working hours, days off, bookings per post),
 * minus the public lead time. `ignoreId` excludes a booking being moved.
 */
async function place(
  deps: AdminBookingDeps,
  settings: SettingsInfo,
  startMs: number,
  durationMin: number,
  wantedPost: number | undefined,
  ignoreId?: string,
): Promise<Placement> {
  const bad = (field: string, message: string): Placement => ({
    ok: false,
    res: { status: 422, body: { errors: { [field]: message } } },
  })
  if (wantedPost !== undefined && wantedPost > settings.posts) return bad('postNo', 'Такого посту немає')
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(startMs))
  const end = startMs + durationMin * 60_000
  const [daysOff, busy] = await Promise.all([
    deps.getDaysOff(),
    deps.getBusy(new Date(startMs - DAY), new Date(end + DAY)),
  ])
  // Working hours / days off / step / not-in-the-past: ignore conflicts here (busy: []).
  const within = computeSlots({
    date,
    durationMin,
    hours: settings.hours,
    posts: 1,
    stepMin: ADMIN_STEP_MIN,
    minLeadMin: 0,
    now: new Date(deps.now().getTime() - GRACE_MS),
    daysOff,
    busy: [],
  })
  if (!within.some((s) => Date.parse(s.start) === startMs)) {
    return bad('start', 'Час поза робочими годинами, вихідний або вже минув')
  }
  const free = (post: number) =>
    !busy.some(
      (b) => b.id !== ignoreId && b.postNo === post && b.start.getTime() < end && b.end.getTime() > startMs,
    )
  const conflict: Placement = { ok: false, res: { status: 409, body: CONFLICT } }
  if (wantedPost !== undefined) return free(wantedPost) ? { ok: true, postNo: wantedPost } : conflict
  for (let p = 1; p <= settings.posts; p++) if (free(p)) return { ok: true, postNo: p }
  return conflict
}

export async function handleBookingPatch(
  id: string,
  json: unknown,
  deps: AdminBookingDeps,
): Promise<HttpResult> {
  if (!uuid.safeParse(id).success) return { status: 404, body: NOT_FOUND }
  const parsed = patchSchema.safeParse(json)
  if (!parsed.success) {
    return { status: 422, body: { errors: { _: 'Вкажіть статус або новий час' } } }
  }
  const booking = await deps.getBooking(id)
  if (!booking) return { status: 404, body: NOT_FOUND }
  const data = parsed.data

  if ('status' in data) {
    if (!canTransition(booking.status, data.status)) {
      return { status: 422, body: { error: 'Недопустима зміна статусу' } }
    }
    const ok = await deps.setStatus(id, booking.status, data.status)
    if (!ok) return { status: 409, body: { error: 'Статус запису вже змінився. Оновіть сторінку.' } }
    return { status: 200, body: { id, status: data.status } }
  }

  if (booking.status !== 'pending' && booking.status !== 'confirmed') {
    return { status: 422, body: { error: 'Цей запис не можна перенести' } }
  }
  const settings = await deps.getSettings()
  const durationMin = Math.round((booking.end.getTime() - booking.start.getTime()) / 60_000)
  const startMs = Date.parse(data.start)
  // Keep the current post unless another one is asked for; fall back to any free post.
  let p = await place(deps, settings, startMs, durationMin, data.postNo ?? booking.postNo, id)
  if (!p.ok && p.res.status === 409 && data.postNo === undefined) {
    p = await place(deps, settings, startMs, durationMin, undefined, id)
  }
  if (!p.ok) return p.res

  const startIso = new Date(startMs).toISOString()
  const endIso = new Date(startMs + durationMin * 60_000).toISOString()
  try {
    const ok = await deps.reschedule(id, startIso, endIso, p.postNo)
    if (!ok) return { status: 404, body: NOT_FOUND }
  } catch (e) {
    if (isOverlap(e)) return { status: 409, body: CONFLICT }
    throw e
  }
  return { status: 200, body: { id, start: startIso, end: endIso, postNo: p.postNo } }
}

export async function handleManualBookingPost(
  json: unknown,
  deps: AdminBookingDeps,
): Promise<HttpResult> {
  const parsed = manualSchema.safeParse(json)
  if (!parsed.success) return { status: 422, body: { errors: zodErrors(parsed.error) } }
  const input = parsed.data
  const phone = normalizeUaPhone(input.phone)
  if (!phone) return { status: 422, body: { errors: { phone: 'Невірний номер телефону' } } }
  const service = await deps.getService(input.serviceId)
  if (!service) return { status: 422, body: { errors: { serviceId: 'Послугу не знайдено' } } }
  const settings = await deps.getSettings()
  const startMs = Date.parse(input.start)
  const p = await place(deps, settings, startMs, service.durationMin, input.postNo)
  if (!p.ok) return p.res
  const args: ManualBookingArgs = {
    serviceId: service.id,
    start: new Date(startMs).toISOString(),
    end: new Date(startMs + service.durationMin * 60_000).toISOString(),
    postNo: p.postNo,
    name: input.name,
    phone,
    carMake: input.carMake,
    carModel: input.carModel,
    carYear: input.carYear ?? null,
    comment: input.comment?.trim() ? input.comment.trim() : null,
  }
  try {
    const id = await deps.createManual(args)
    return { status: 201, body: { id } }
  } catch (e) {
    if (isOverlap(e)) return { status: 409, body: CONFLICT }
    throw e
  }
}
