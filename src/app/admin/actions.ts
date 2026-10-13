'use server'

import { redirect } from 'next/navigation'
import { isOwner } from '@/lib/auth'
import { createServerSupabase, hasSupabaseAuthEnv } from '@/lib/supabase/server'

export type LoginState = { error?: string }

const GENERIC = 'Невірний email або пароль'

export async function loginAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!hasSupabaseAuthEnv()) return { error: 'Сервіс авторизації не налаштований. Зверніться до розробника.' }
  const email = String(form.get('email') ?? '').trim()
  const password = String(form.get('password') ?? '')
  if (!email || !password) return { error: 'Введіть email і пароль' }

  const supabase = await createServerSupabase()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) return { error: GENERIC }
  if (!isOwner(data.user)) {
    await supabase.auth.signOut()
    return { error: GENERIC } // same message: do not reveal that the account exists
  }
  redirect('/admin')
}

export async function logoutAction(): Promise<void> {
  if (hasSupabaseAuthEnv()) {
    const supabase = await createServerSupabase()
    await supabase.auth.signOut()
  }
  redirect('/admin/login')
}
