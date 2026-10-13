import { NextResponse } from 'next/server'
import { requireOwnerApi } from '@/lib/auth-server'
import { parseBody, refreshSiteContent, serverError } from '@/lib/admin-api'
import { settingsSchema } from '@/lib/admin-schemas'

/** settings is a single row (id = true); upsert so it also works on a fresh database. */
export async function PATCH(request: Request) {
  const auth = await requireOwnerApi()
  if (!auth.ok) return auth.response
  const body = await parseBody(request, settingsSchema)
  if (!body.ok) return body.response
  try {
    const { error } = await auth.supabase.from('settings').upsert({ id: true, ...body.data }, { onConflict: 'id' })
    if (error) throw error
    refreshSiteContent()
    return NextResponse.json({ ok: true })
  } catch (e) {
    return serverError('PATCH /api/admin/settings', e)
  }
}
