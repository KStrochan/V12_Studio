import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AdminBookingDeps } from '../admin-bookings'
import type { WorkingHours } from '../slots'
import type { BookingStatus } from '../booking-transitions'

type Row = Record<string, unknown>
const must = <T>(r: { data: T | null; error: { message: string; code?: string } | null }): T => {
  if (r.error) throw Object.assign(new Error(r.error.message), { code: r.error.code })
  return r.data as T
}

/** Deps bound to the owner's session client: every query runs under RLS (is_owner()). */
export function createAdminBookingDeps(db: SupabaseClient): AdminBookingDeps {
  return {
    now: () => new Date(),
    async getBooking(id) {
      const row = must<Row | null>(
        await db.from('bookings').select('id,status,start_at,end_at,post_no').eq('id', id).maybeSingle(),
      )
      return row
        ? {
            id: row.id as string,
            status: row.status as BookingStatus,
            start: new Date(row.start_at as string),
            end: new Date(row.end_at as string),
            postNo: row.post_no as number,
          }
        : null
    },
    async getService(id) {
      const row = must<Row | null>(
        await db.from('services').select('id,duration_min').eq('id', id).eq('active', true).maybeSingle(),
      )
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
      return must<Row[]>(await db.from('days_off').select('day')).map((r) => r.day as string)
    },
    async getBusy(from, to) {
      const rows = must<Row[]>(
        await db
          .from('bookings')
          .select('id,start_at,end_at,post_no')
          .in('status', ['pending', 'confirmed'])
          .lt('start_at', to.toISOString())
          .gt('end_at', from.toISOString()),
      )
      return rows.map((r) => ({
        id: r.id as string,
        start: new Date(r.start_at as string),
        end: new Date(r.end_at as string),
        postNo: r.post_no as number,
      }))
    },
    async setStatus(id, from, to) {
      const rows = must<Row[]>(
        await db.from('bookings').update({ status: to }).eq('id', id).eq('status', from).select('id'),
      )
      return rows.length > 0
    },
    async reschedule(id, start, end, postNo) {
      const rows = must<Row[]>(
        await db
          .from('bookings')
          .update({ start_at: start, end_at: end, post_no: postNo })
          .eq('id', id)
          .in('status', ['pending', 'confirmed'])
          .select('id'),
      )
      return rows.length > 0
    },
    async createManual(a) {
      const r = await db.rpc('admin_create_booking_tx', {
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
  }
}
