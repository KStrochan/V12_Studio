import { clientIp, handleBookingPost } from '@/lib/booking-service'
import { createSupabaseDeps } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return Response.json({ errors: { _: 'Невірний запит' } }, { status: 422 })
  }
  try {
    const r = await handleBookingPost(json, clientIp(request.headers), createSupabaseDeps())
    return Response.json(r.body, { status: r.status })
  } catch (e) {
    console.error('POST /api/bookings', e)
    return Response.json({ error: 'Сервіс тимчасово недоступний' }, { status: 500 })
  }
}
