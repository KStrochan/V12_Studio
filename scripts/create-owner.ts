/* Usage: npx tsx scripts/create-owner.ts <email> <password>
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment (.env.local is loaded if present). */
import { createClient } from '@supabase/supabase-js'
import { existsSync } from 'node:fs'

if (existsSync('.env.local')) process.loadEnvFile('.env.local')

const [email, password] = process.argv.slice(2)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!email || !password) {
  console.error('Usage: tsx scripts/create-owner.ts <email> <password>')
  process.exit(1)
}
if (!url || !key) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.')
  process.exit(1)
}

const db = createClient(url, key, { auth: { persistSession: false } })
const { data, error } = await db.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  app_metadata: { role: 'owner' },
})
if (error) {
  console.error('Failed to create owner:', error.message)
  process.exit(1)
}
console.log(`Owner created: ${data.user.email} (${data.user.id})`)
