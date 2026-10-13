'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { btnCls, btnPrimaryCls, fieldCls } from '@/components/admin/AdminDialog'
import { alertCls, sendJson } from '@/components/admin/send'
import { kyivLongDay } from '@/lib/admin-bookings-ui'

export type DayOffRow = { day: string; reason: string | null }

export function DaysOff({ days }: { days: DayOffRow[] }) {
  const router = useRouter()
  const [day, setDay] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const r = await sendJson('/api/admin/days-off', 'POST', { day, reason: reason || undefined })
    setBusy(false)
    if (!r.ok) return setError(r.error)
    setDay('')
    setReason('')
    router.refresh()
  }

  async function remove(d: string) {
    setError('')
    setBusy(true)
    const r = await sendJson(`/api/admin/days-off/${d}`, 'DELETE')
    setBusy(false)
    if (!r.ok) setError(r.error)
    router.refresh()
  }

  return (
    <section aria-labelledby="days-off-h" className="max-w-xl space-y-3">
      <h2 id="days-off-h" className="font-heading text-xl">Вихідні дні</h2>
      <form onSubmit={add} aria-label="Додати вихідний" className="flex flex-wrap items-end gap-2">
        <label className="space-y-1 text-sm text-muted">
          Дата
          <input type="date" className={fieldCls} value={day} onChange={(e) => setDay(e.target.value)} />
        </label>
        <label className="min-w-40 flex-1 space-y-1 text-sm text-muted">
          Причина (необов’язково)
          <input className={fieldCls} value={reason} maxLength={100} onChange={(e) => setReason(e.target.value)} />
        </label>
        <button type="submit" disabled={busy} className={btnPrimaryCls}>
          Додати вихідний
        </button>
      </form>
      {error ? <p role="alert" className={alertCls}>{error}</p> : null}
      {days.length === 0 ? <p className="text-muted">Найближчих вихідних немає.</p> : null}
      <ul aria-label="Вихідні" className="space-y-2">
        {days.map((d) => (
          <li key={d.day} data-testid="day-off" data-day={d.day} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-panel px-4 py-2">
            <span>
              {kyivLongDay(d.day)} <span className="text-sm text-muted">{d.day}</span>
              {d.reason ? <span className="block text-sm text-muted">{d.reason}</span> : null}
            </span>
            <button type="button" disabled={busy} onClick={() => remove(d.day)} className={btnCls} aria-label={`Прибрати вихідний ${d.day}`}>
              Прибрати
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
