'use client'

import { useState } from 'react'
import { AdminDialog, btnCls, btnPrimaryCls, fieldCls } from '@/components/admin/AdminDialog'
import { kyivDay, kyivTime, kyivToIso, type BookingView } from '@/lib/admin-bookings-ui'

export function RescheduleDialog({
  booking,
  posts,
  onClose,
  onDone,
}: {
  booking: BookingView
  posts: number
  onClose: () => void
  onDone: () => void
}) {
  const [day, setDay] = useState(kyivDay(booking.start))
  const [time, setTime] = useState(kyivTime(booking.start))
  const [post, setPost] = useState(String(booking.postNo))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ start: kyivToIso(day, time), postNo: Number(post) }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        errors?: Record<string, string>
      }
      if (res.ok) return onDone()
      setError(data.error ?? Object.values(data.errors ?? {})[0] ?? 'Не вдалося перенести запис')
    } catch {
      setError('Немає зв’язку із сервером')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminDialog title="Перенести запис" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-sm text-muted">{booking.clientName} · {booking.service}</p>
        <label className="block text-sm">
          Дата
          <input type="date" required value={day} onChange={(e) => setDay(e.target.value)} className={fieldCls} />
        </label>
        <label className="block text-sm">
          Час
          <input type="time" required step={300} value={time} onChange={(e) => setTime(e.target.value)} className={fieldCls} />
        </label>
        <label className="block text-sm">
          Пост
          <select value={post} onChange={(e) => setPost(e.target.value)} className={fieldCls}>
            {Array.from({ length: posts }, (_, i) => i + 1).map((p) => (
              <option key={p} value={p}>
                Пост {p}
              </option>
            ))}
          </select>
        </label>
        {error ? (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnCls}>
            Скасувати
          </button>
          <button type="submit" disabled={saving} className={btnPrimaryCls}>
            {saving ? 'Зберігаємо…' : 'Перенести'}
          </button>
        </div>
      </form>
    </AdminDialog>
  )
}
