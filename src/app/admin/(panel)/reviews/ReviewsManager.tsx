'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { btnCls, btnPrimaryCls, fieldCls } from '@/components/admin/AdminDialog'
import { alertCls, sendJson } from '@/components/admin/send'
import { cn } from '@/lib/cn'

export type ReviewRow = { id: string; author: string; body: string; rating: number; visible: boolean }

export function ReviewsManager({ reviews }: { reviews: ReviewRow[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [author, setAuthor] = useState('')
  const [body, setBody] = useState('')
  const [rating, setRating] = useState('5')
  const [adding, setAdding] = useState(false)

  async function toggle(r: ReviewRow) {
    setError('')
    setBusy(r.id)
    const res = await sendJson(`/api/admin/reviews/${r.id}`, 'PATCH', { visible: !r.visible })
    setBusy(null)
    if (!res.ok) setError(res.error)
    router.refresh()
  }

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setAdding(true)
    const res = await sendJson('/api/admin/reviews', 'POST', { author, body, rating: Number(rating), visible: true })
    setAdding(false)
    if (!res.ok) return setError(res.error)
    setAuthor('')
    setBody('')
    setRating('5')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {error ? <p role="alert" className={alertCls}>{error}</p> : null}
      {reviews.length === 0 ? <p className="text-muted">Відгуків ще немає.</p> : null}
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Відгуки">
        {reviews.map((r) => (
          <li
            key={r.id}
            data-testid="review-card"
            data-visible={r.visible}
            className={cn('list-none rounded-xl border border-line bg-panel p-4', !r.visible && 'opacity-70')}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-heading text-lg">{r.author}</p>
              <span aria-label={`Оцінка ${r.rating} з 5`} className="text-sm">{'★'.repeat(r.rating)}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{r.body}</p>
            <p className="mt-2 text-xs text-muted">{r.visible ? 'Видно на сайті' : 'Сховано'}</p>
            <button type="button" disabled={busy === r.id} onClick={() => toggle(r)} className={cn('mt-2', r.visible ? btnCls : btnPrimaryCls)}>
              {r.visible ? 'Сховати' : 'Показати'}
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={add} aria-label="Новий відгук" className="max-w-xl space-y-3 rounded-xl border border-line bg-panel p-4">
        <h2 className="font-heading text-xl">Додати відгук</h2>
        <label className="block space-y-1 text-sm text-muted">
          Автор
          <input className={fieldCls} value={author} maxLength={60} onChange={(e) => setAuthor(e.target.value)} />
        </label>
        <label className="block space-y-1 text-sm text-muted">
          Текст
          <textarea className={`${fieldCls} py-2`} rows={3} maxLength={1000} value={body} onChange={(e) => setBody(e.target.value)} />
        </label>
        <label className="block space-y-1 text-sm text-muted">
          Оцінка
          <select className={fieldCls} value={rating} onChange={(e) => setRating(e.target.value)}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={adding} className={btnPrimaryCls}>
          Додати відгук
        </button>
      </form>
    </div>
  )
}
