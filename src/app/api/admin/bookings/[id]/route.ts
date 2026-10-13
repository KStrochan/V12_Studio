import { NextResponse } from 'next/server'
import { requireOwnerApi } from '@/lib/auth-server'
import { handleBookingPatch } from '@/lib/admin-bookings'
import { createAdminBookingDeps } from '@/lib/supabase/admin-bookings'

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireOwnerApi()
  if (!auth.ok) return auth.response
  const { id } = await ctx.params
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ errors: { _: 'Невірний запит' } }, { status: 422 })
  }
  try {
    const r = await handleBookingPatch(id, json, createAdminBookingDeps(auth.supabase))
    return NextResponse.json(r.body, { status: r.status })
  } catch (e) {
    console.error('PATCH /api/admin/bookings/:id', e)
    return NextResponse.json({ error: 'Сервіс тимчасово недоступний' }, { status: 500 })
  }
}
