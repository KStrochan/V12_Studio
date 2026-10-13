import { NextResponse } from 'next/server'
import { requireOwnerApi } from '@/lib/auth-server'
import { fail, parseBody, parseId, refreshSiteContent, serverError } from '@/lib/admin-api'
import { reviewPatchSchema } from '@/lib/admin-schemas'

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireOwnerApi()
  if (!auth.ok) return auth.response
  const id = parseId((await ctx.params).id)
  if (!id.ok) return id.response
  const body = await parseBody(request, reviewPatchSchema)
  if (!body.ok) return body.response
  try {
    const { data, error } = await auth.supabase
      .from('reviews')
      .update({ visible: body.data.visible })
      .eq('id', id.id)
      .select('id')
      .maybeSingle()
    if (error) throw error
    if (!data) return fail('Відгук не знайдено', 404)
    refreshSiteContent()
    return NextResponse.json(data)
  } catch (e) {
    return serverError('PATCH /api/admin/reviews/:id', e)
  }
}
