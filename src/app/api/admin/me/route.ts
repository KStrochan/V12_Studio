import { NextResponse } from 'next/server'
import { requireOwnerApi } from '@/lib/auth-server'

export async function GET() {
  const auth = await requireOwnerApi()
  if (!auth.ok) return auth.response
  return NextResponse.json({ id: auth.user.id, email: auth.user.email })
}
