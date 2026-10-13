import { clientIp, handleSlotsGet } from '@/lib/booking-service'
import { createSupabaseDeps } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams
  try {
    const r = await handleSlotsGet(
      { serviceId: sp.get('serviceId'), date: sp.get('date') },
      clientIp(request.headers),
      createSupabaseDeps(),
    )
    return Response.json(r.body, { status: r.status })
  } catch (e) {
    console.error('GET /api/slots', e)
    return Response.json({ error: 'Сервіс тимчасово недоступний' }, { status: 500 })
  }
}
