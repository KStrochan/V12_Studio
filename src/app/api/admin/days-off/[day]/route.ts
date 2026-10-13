import { NextResponse } from 'next/server'
import { requireOwnerApi } from '@/lib/auth-server'
import { fail, serverError } from '@/lib/admin-api'
import { dayParamSchema } from '@/lib/admin-schemas'

export async function DELETE(_request: Request, ctx: { params: Promise<{ day: string }> }) {
  const auth = await requireOwnerApi()
  if (!auth.ok) return auth.response
  const day = dayParamSchema.safeParse((await ctx.params).day)
  if (!day.success) return fail('Невірна дата')
  try {
    const { error } = await auth.supabase.from('days_off').delete().eq('day', day.data)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    return serverError('DELETE /api/admin/days-off/:day', e)
  }
}
