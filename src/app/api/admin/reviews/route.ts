import { NextResponse } from 'next/server'
import { requireOwnerApi } from '@/lib/auth-server'
import { parseBody, refreshSiteContent, serverError } from '@/lib/admin-api'
import { reviewCreateSchema } from '@/lib/admin-schemas'

export async function POST(request: Request) {
  const auth = await requireOwnerApi()
  if (!auth.ok) return auth.response
  const body = await parseBody(request, reviewCreateSchema)
  if (!body.ok) return body.response
  try {
    const { data, error } = await auth.supabase.from('reviews').insert(body.data).select('id').single()
    if (error) throw error
    refreshSiteContent()
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    return serverError('POST /api/admin/reviews', e)
  }
}
