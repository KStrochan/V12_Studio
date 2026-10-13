import { NextResponse } from 'next/server'
import { requireOwnerApi } from '@/lib/auth-server'
import { handleManualBookingPost } from '@/lib/admin-bookings'
import { createAdminBookingDeps } from '@/lib/supabase/admin-bookings'

export async function POST(request: Request) {
  const auth = await requireOwnerApi()
  if (!auth.ok) return auth.response
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ errors: { _: 'Невірний запит' } }, { status: 422 })
  }
  try {
    const r = await handleManualBookingPost(json, createAdminBookingDeps(auth.supabase))
    return NextResponse.json(r.body, { status: r.status })
  } catch (e) {
    console.error('POST /api/admin/bookings', e)
    return NextResponse.json({ error: 'Сервіс тимчасово недоступний' }, { status: 500 })
  }
}
