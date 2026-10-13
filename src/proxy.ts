import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isOwner } from '@/lib/auth'

type Cookie = { name: string; value: string; options?: Parameters<NextResponse['cookies']['set']>[2] }

/**
 * Optimistic edge gate for /admin/* and /api/admin/*. Real authorization is re-checked in the
 * (panel) layout, in every admin page (requireOwner) and in API handlers (requireOwnerApi).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isApi = pathname.startsWith('/api/')
  const isLogin = pathname === '/admin/login' || pathname === '/admin/login/'
  if (isLogin) return NextResponse.next()

  const pending: Cookie[] = []
  let pendingHeaders: Record<string, string> = {}
  const apply = (res: NextResponse) => {
    for (const c of pending) res.cookies.set(c.name, c.value, c.options)
    for (const [k, v] of Object.entries(pendingHeaders)) res.headers.set(k, v)
    return res
  }

  const deny = (status: 401 | 403, forbiddenRedirect = false) => {
    const res = isApi
      ? NextResponse.json({ error: status === 401 ? 'unauthorized' : 'forbidden' }, { status })
      : NextResponse.redirect(new URL(forbiddenRedirect ? '/admin/login?e=forbidden' : '/admin/login', request.url))
    return apply(res)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return deny(401)

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list, headers) => {
        for (const c of list) {
          // keep downstream handlers in sync with a rotated refresh token
          request.cookies.set(c.name, c.value)
          pending.push(c)
        }
        pendingHeaders = { ...pendingHeaders, ...headers }
      },
    },
  })

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch {
    user = null
  }

  if (!user) return deny(401)
  if (!isOwner(user)) {
    // Valid session without owner role: sign out (clears cookies) and explain.
    pending.length = 0 // drop refreshed cookies; the deletions from signOut must win
    pendingHeaders = {}
    await supabase.auth.signOut()
    return deny(403, true)
  }

  return apply(NextResponse.next({ request }))
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
