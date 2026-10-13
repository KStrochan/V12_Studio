import 'server-only'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { isOwner } from './auth'
import { createServerSupabase, hasSupabaseAuthEnv } from './supabase/server'

/** For server components / layouts / actions: returns the verified owner or redirects to login. */
export async function requireOwner() {
  if (!hasSupabaseAuthEnv()) redirect('/admin/login')
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.auth.getUser() // server-verified, not getSession()
  const user = data?.user
  if (error || !user) redirect('/admin/login')
  if (!isOwner(user)) redirect('/admin/login?e=forbidden')
  return { user, supabase }
}

/**
 * For route handlers (/api/admin/*):
 *   const auth = await requireOwnerApi(); if (!auth.ok) return auth.response
 */
export async function requireOwnerApi() {
  if (!hasSupabaseAuthEnv()) {
    return { ok: false as const, response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  }
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.auth.getUser()
  const user = data?.user
  if (error || !user) {
    return { ok: false as const, response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  }
  if (!isOwner(user)) {
    return { ok: false as const, response: NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  }
  return { ok: true as const, user, supabase }
}
