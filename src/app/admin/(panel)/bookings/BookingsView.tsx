'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { btnCls, btnPrimaryCls, fieldCls } from '@/components/admin/AdminDialog'
import { cn } from '@/lib/cn'
import { BOOKING_STATUSES, STATUS_LABEL, type BookingStatus } from '@/lib/booking-transitions'
import { kyivDay, kyivLongDay, shiftDay, type BookingView, type ServiceOption } from '@/lib/admin-bookings-ui'
import { BookingCalendar } from './BookingCalendar'
import { BookingCard } from './BookingCard'
import { ManualBookingDialog } from './ManualBookingDialog'
import { RescheduleDialog } from './RescheduleDialog'

type StatusFilter = BookingStatus | 'all'

export function BookingsView({
  bookings,
  services,
  posts,
  today,
}: {
  bookings: BookingView[]
  services: ServiceOption[]
  posts: number
  today: string
}) {
  const router = useRouter()
  const [view, setView] = useState<'list' | 'day'>('list')
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [day, setDay] = useState(today)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [moving, setMoving] = useState<BookingView | null>(null)
  const [adding, setAdding] = useState(false)

  const filtered = useMemo(
    () => bookings.filter((b) => (filter === 'all' || b.status === filter) && (view === 'list' || kyivDay(b.start) === day)),
    [bookings, filter, view, day],
  )
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: bookings.length }
    for (const b of bookings) c[b.status] = (c[b.status] ?? 0) + 1
    return c
  }, [bookings])

  async function setStatus(id: string, status: BookingStatus) {
    setError('')
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error ?? 'Не вдалося змінити статус')
      }
      router.refresh()
    } catch {
      setError('Немає зв’язку із сервером')
    } finally {
      setBusyId(null)
    }
  }

  const done = () => {
    setMoving(null)
    setAdding(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl">Записи</h1>
        <button type="button" onClick={() => setAdding(true)} className={btnPrimaryCls}>
          Додати запис
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div role="group" aria-label="Вигляд" className="flex rounded-lg border border-line p-0.5">
          {(['list', 'day'] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn('min-h-11 rounded-md px-4 text-sm', view === v ? 'bg-panel-2' : 'text-muted')}
            >
              {v === 'list' ? 'Список' : 'День'}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="status-filter">
          Статус
        </label>
        <select
          id="status-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value as StatusFilter)}
          className={cn(fieldCls, 'w-auto')}
        >
          <option value="all">Усі статуси ({counts.all})</option>
          {BOOKING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]} ({counts[s] ?? 0})
            </option>
          ))}
        </select>
      </div>

      {view === 'day' ? (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" aria-label="Попередній день" onClick={() => setDay(shiftDay(day, -1))} className={cn(btnCls, 'w-11 px-0')}>
            ←
          </button>
          <input
            type="date"
            aria-label="Дата"
            value={day}
            onChange={(e) => e.target.value && setDay(e.target.value)}
            className={cn(fieldCls, 'w-auto')}
          />
          <button type="button" aria-label="Наступний день" onClick={() => setDay(shiftDay(day, 1))} className={cn(btnCls, 'w-11 px-0')}>
            →
          </button>
          <button type="button" onClick={() => setDay(today)} className={btnCls}>
            Сьогодні
          </button>
          <p className="text-sm text-muted">{kyivLongDay(day)}</p>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {view === 'day' ? <BookingCalendar bookings={filtered} posts={posts} /> : null}

      {filtered.length === 0 ? (
        <p className="text-muted">Записів немає.</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Записи">
          {filtered.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              busy={busyId === b.id}
              showDate={view === 'list'}
              onStatus={setStatus}
              onReschedule={setMoving}
            />
          ))}
        </ul>
      )}

      {moving ? <RescheduleDialog booking={moving} posts={posts} onClose={() => setMoving(null)} onDone={done} /> : null}
      {adding ? (
        <ManualBookingDialog services={services} posts={posts} defaultDay={day} onClose={() => setAdding(false)} onDone={done} />
      ) : null}
    </div>
  )
}
