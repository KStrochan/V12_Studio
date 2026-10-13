import { NextResponse } from 'next/server'
import { requireOwnerApi } from '@/lib/auth-server'
import { fail, parseBody, parseId, serverError } from '@/lib/admin-api'
import { clientPatchSchema } from '@/lib/admin-schemas'

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireOwnerApi()
  if (!auth.ok) return auth.response
  const id = parseId((await ctx.params).id)
  if (!id.ok) return id.response
  const body = await parseBody(request, clientPatchSchema)
  if (!body.ok) return body.response
  try {
    const { data, error } = await auth.supabase
      .from('clients')
      .update({ notes: body.data.notes })
      .eq('id', id.id)
      .select('id,notes')
      .maybeSingle()
    if (error) throw error
    if (!data) return fail('Клієнта не знайдено', 404)
    return NextResponse.json(data)
  } catch (e) {
    return serverError('PATCH /api/admin/clients/:id', e)
  }
}
