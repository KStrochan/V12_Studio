import { createClient } from '@supabase/supabase-js'

/** Anon-key client for public reads (RLS applies). */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase public env vars are not set')
  return createClient(url, key, { auth: { persistSession: false } })
}
