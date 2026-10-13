import { NextResponse } from 'next/server'
import { requireOwnerApi } from '@/lib/auth-server'
import { parseBody, serverError } from '@/lib/admin-api'
import { dayOffSchema } from '@/lib/admin-schemas'

export async function POST(request: Request) {
  const auth = await requireOwnerApi()
  if (!auth.ok) return auth.response
  const body = await parseBody(request, dayOffSchema)
  if (!body.ok) return body.response
  try {
    const { error } = await auth.supabase
      .from('days_off')
      .upsert({ day: body.data.day, reason: body.data.reason || null }, { onConflict: 'day' })
    if (error) throw error
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (e) {
    return serverError('POST /api/admin/days-off', e)
  }
}
