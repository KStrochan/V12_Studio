import { Suspense } from 'react'
import { connection } from 'next/server'
import { hasSupabaseAuthEnv } from '@/lib/supabase/server'
import { LoginForm } from './LoginForm'

async function LoginBody({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  await connection() // render per request. NEXT_PUBLIC_* are inlined at build time: rebuild after changing them
  const { e } = await searchParams
  if (!hasSupabaseAuthEnv()) {
    return (
      <p role="alert" className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        Авторизація не налаштована: відсутні змінні середовища Supabase (NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY).
      </p>
    )
  }
  const notice = e === 'forbidden' ? 'Цей обліковий запис не має доступу до адмінки.' : undefined
  return <LoginForm notice={notice} />
}

export default function LoginPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-4 py-10">
      <h1 className="font-heading mb-6 text-2xl">Адмінка V12</h1>
      <Suspense fallback={<p className="text-muted">Завантаження…</p>}>
        <LoginBody searchParams={searchParams} />
      </Suspense>
    </main>
  )
}
