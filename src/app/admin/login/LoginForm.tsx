'use client'

import { useActionState } from 'react'
import { loginAction, type LoginState } from '../actions'

const field =
  'block w-full min-h-12 rounded-lg border border-line bg-panel-2 px-4 text-base text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/60'

export function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {})
  const message = state.error ?? notice
  return (
    <form action={action} className="space-y-4" aria-label="Вхід в адмінку">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm text-muted">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className={field} />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm text-muted">
          Пароль
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={field} />
      </div>
      {message ? (
        <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 w-full rounded-lg bg-white px-4 text-base font-semibold text-black disabled:opacity-60"
      >
        {pending ? 'Входимо…' : 'Увійти'}
      </button>
    </form>
  )
}
