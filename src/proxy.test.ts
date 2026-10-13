import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

type Cb = { getAll(): { name: string; value: string }[]; setAll(l: { name: string; value: string; options?: object }[], h: Record<string, string>): void }
let mode: 'refresh' | 'nonowner'
let captured: Cb

vi.mock('@supabase/ssr', () => ({
  createServerClient: (_u: string, _k: string, o: { cookies: Cb }) => {
    captured = o.cookies
    return {
      auth: {
        async getUser() {
          o.cookies.setAll([{ name: 'sb-access', value: 'NEW' }], { 'Cache-Control': 'private, no-store' })
          return { data: { user: { app_metadata: { role: mode === 'refresh' ? 'owner' : 'x' } } } }
        },
        async signOut() {
          o.cookies.setAll([{ name: 'sb-access', value: '', options: { maxAge: 0 } }], {})
        },
      },
    }
  },
}))

import { proxy } from './proxy'

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://x'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'k'
})

const req = () => new NextRequest('http://localhost/admin', { headers: { cookie: 'sb-access=OLD' } })

describe('proxy cookie propagation', () => {
  it('owner: refreshed cookie reaches request and response, with cache headers', async () => {
    mode = 'refresh'
    const r = req()
    const res = await proxy(r)
    expect(r.cookies.get('sb-access')?.value).toBe('NEW')
    expect(res.cookies.get('sb-access')?.value).toBe('NEW')
    expect(res.headers.get('cache-control')).toBe('private, no-store')
    expect(captured).toBeTruthy()
  })
  it('non-owner: redirected and the cookie deletion wins', async () => {
    mode = 'nonowner'
    const res = await proxy(req())
    expect(res.headers.get('location')).toContain('/admin/login?e=forbidden')
    expect(res.cookies.get('sb-access')?.value).toBe('')
  })
})
