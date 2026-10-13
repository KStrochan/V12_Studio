import { NextResponse } from 'next/server'
import { requireOwnerApi } from '@/lib/auth-server'
import { fail, parseBody, parseId, refreshSiteContent, serverError } from '@/lib/admin-api'
import { servicePatchSchema } from '@/lib/admin-schemas'

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireOwnerApi()
  if (!auth.ok) return auth.response
  const id = parseId((await ctx.params).id)
  if (!id.ok) return id.response
  const body = await parseBody(request, servicePatchSchema)
  if (!body.ok) return body.response
  try {
    const { data, error } = await auth.supabase
      .from('services')
      .update(body.data)
      .eq('id', id.id)
      .select('id')
      .maybeSingle()
    if (error) throw error
    if (!data) return fail('Послугу не знайдено', 404)
    refreshSiteContent()
    return NextResponse.json(data)
  } catch (e) {
    return serverError('PATCH /api/admin/services/:id', e)
  }
}
