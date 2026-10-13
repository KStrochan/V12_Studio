import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { BookingDeps, NotifyEvent } from '../booking-service'
import type { WorkingHours } from '../slots'
import { buildOwnerMessage, notifyOwner } from '../telegram'
import type { BookingStatus, SetStatusResult } from '../telegram-webhook'

/** Service-role client. Server only: never import from client components. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase admin env vars are not set')
  return createClient(url, key, { auth: { persistSession: false } })
}

type Row = Record<string, unknown>
const must = <T>(r: { data: T | null; error: { message: string; code?: string } | null }): T => {
  if (r.error) throw Object.assign(new Error(r.error.message), { code: r.error.code })
  return r.data as T
}

export type Notifier = (event: NotifyEvent) => Promise<void>

/** pending -> confirmed|rejected only, atomically; repeat calls are no-ops. */
export async function setBookingStatusDb(
  db: ReturnType<typeof createAdminClient>,
  id: string,
  target: BookingStatus,
): Promise<SetStatusResult> {
  const upd = must<Row[]>(
    await db.from('bookings').update({ status: target }).eq('id', id).eq('status', 'pending').select('id'),
  )
  if (upd.length) return { result: 'updated' }
  const cur = must<Row | null>(await db.from('bookings').select('status').eq('id', id).maybeSingle())
  return cur ? { result: 'unchanged', status: cur.status as string } : { result: 'not_found' }
}

/** Default notifier: Telegram message to the owner. Never throws. */
function telegramNotifier(db: ReturnType<typeof createAdminClient>): Notifier {
  return async (event) => {
    try {
      let serviceName = ''
      if (event.type === 'booking') {
        const r = await db.from('services').select('title').eq('id', event.booking.serviceId).maybeSingle()
        serviceName = ((r.data as Row | null)?.title as string | undefined) ?? 'Послуга'
      }
      await notifyOwner(buildOwnerMessage(event, serviceName))
    } catch (e) {
      console.error('telegram notifier error', e)
    }
  }
}

export function createSupabaseDeps(notify?: Notifier): BookingDeps {
  const db = createAdminClient()
  return {
    now: () => new Date(),
    async getService(id) {
      const r = await db.from('services').select('id,duration_min').eq('id', id).eq('active', true).maybeSingle()
      const row = must<Row | null>(r)
      return row ? { id: row.id as string, durationMin: row.duration_min as number } : null
    },
    async getSettings() {
      const row = must<Row>(await db.from('settings').select('*').limit(1).single())
      return {
        hours: row.working_hours as WorkingHours,
        posts: row.posts as number,
        stepMin: row.step_min as number,
        minLeadMin: row.min_lead_min as number,
      }
    },
    async getDaysOff() {
      const rows = must<Row[]>(await db.from('days_off').select('day'))
      return rows.map((r) => r.day as string)
    },
    async getBusy(from, to) {
      const rows = must<Row[]>(
        await db
          .from('bookings')
          .select('start_at,end_at,post_no')
          .in('status', ['pending', 'confirmed'])
          .lt('start_at', to.toISOString())
          .gt('end_at', from.toISOString()),
      )
      return rows.map((r) => ({
        start: new Date(r.start_at as string),
        end: new Date(r.end_at as string),
        postNo: r.post_no as number,
      }))
    },
    async createBookingTx(a) {
      const r = await db.rpc('create_booking_tx', {
        p_service_id: a.serviceId,
        p_start: a.start,
        p_end: a.end,
        p_post_no: a.postNo,
        p_name: a.name,
        p_phone: a.phone,
        p_car_make: a.carMake,
        p_car_model: a.carModel,
        p_comment: a.comment,
      })
      return must<string>(r)
    },
    async rateLimit(key, max, windowSec) {
      const r = await db.rpc('hit_rate_limit', { p_key: key, p_max: max, p_window_sec: windowSec })
      return must<boolean>(r)
    },
    async insertConsultation(c) {
      const r = await db.from('consultations').insert(c).select('id').single()
      return must<Row>(r).id as string
    },
    notify: notify ?? telegramNotifier(db),
  }
}
