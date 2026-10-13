'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { btnCls, btnPrimaryCls } from '@/components/admin/AdminDialog'
import { alertCls, sendJson } from '@/components/admin/send'
import { cn } from '@/lib/cn'

export type ConsultationView = {
  id: string
  name: string
  phone: string
  question: string
  status: 'new' | 'handled'
  created: string
}

export function ConsultationList({ items }: { items: ConsultationView[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function toggle(c: ConsultationView) {
    setError('')
    setBusy(c.id)
    const r = await sendJson(`/api/admin/consultations/${c.id}`, 'PATCH', {
      status: c.status === 'new' ? 'handled' : 'new',
    })
    setBusy(null)
    if (!r.ok) setError(r.error)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {error ? <p role="alert" className={alertCls}>{error}</p> : null}
      {items.length === 0 ? <p className="text-muted">Консультацій ще немає.</p> : null}
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Консультації">
        {items.map((c) => (
          <li
            key={c.id}
            data-testid="consultation-card"
            data-status={c.status}
            className={cn('list-none rounded-xl border bg-panel p-4', c.status === 'new' ? 'border-fg/50' : 'border-line opacity-80')}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-heading text-lg">{c.name}</p>
              <span className="text-xs text-muted">{c.status === 'new' ? 'Нова' : 'Опрацьовано'}</span>
            </div>
            <a href={`tel:${c.phone}`} className="inline-flex min-h-11 items-center underline">
              {c.phone}
            </a>
            {c.question ? <p className="text-sm text-muted">{c.question}</p> : null}
            <p className="mt-1 text-xs text-muted">{c.created}</p>
            <button
              type="button"
              disabled={busy === c.id}
              onClick={() => toggle(c)}
              className={cn('mt-3', c.status === 'new' ? btnPrimaryCls : btnCls)}
            >
              {c.status === 'new' ? 'Опрацьовано' : 'Повернути в нові'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
