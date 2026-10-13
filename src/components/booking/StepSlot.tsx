'use client'

import { cn } from '@/lib/cn'
import type { Slot } from './useSlots'
import { formatTime, type Day } from './dates'
import { radioKeyDown } from './radio'

type Props = {
  days: Day[]
  date?: string
  disabledDays: Set<string>
  onDate: (iso: string) => void
  slots: Slot[]
  loading: boolean
  error?: string
  onRetry: () => void
  slot?: string
  onSlot: (start: string) => void
  notice?: string
}

export function StepSlot({ days, date, disabledDays, onDate, slots, loading, error, onRetry, slot, onSlot, notice }: Props) {
  const starts = Array.from(new Set(slots.map((s) => s.start))).sort()
  const tabDay = days.find((d) => d.iso === date && !disabledDays.has(d.iso))?.iso ?? days.find((d) => !disabledDays.has(d.iso))?.iso
  const tabSlot = starts.includes(slot ?? '') ? slot : starts[0]

  return (
    <div>
      <div
        role="radiogroup"
        aria-labelledby="booking-step-title"
        onKeyDown={(e) => radioKeyDown(e, false)}
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:px-0"
      >
        {days.map((d) => {
          const off = disabledDays.has(d.iso)
          const checked = d.iso === date
          return (
            <button
              key={d.iso}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={off ? `${d.label}, недоступно` : d.label}
              disabled={off}
              tabIndex={d.iso === tabDay ? 0 : -1}
              data-date={d.iso}
              onClick={() => onDate(d.iso)}
              className={cn(
                'flex min-h-16 min-w-14 shrink-0 flex-col items-center justify-center rounded-xl border px-2 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                checked ? 'border-white/70 bg-panel-2' : 'border-line bg-bg',
                off ? 'cursor-not-allowed text-white/25 line-through' : 'hover:border-white/30',
              )}
            >
              <span className="text-xs uppercase text-muted">{d.weekday}</span>
              <span className="font-heading text-lg font-semibold">{d.dayNum}</span>
            </button>
          )
        })}
      </div>

      <div aria-live="polite" className="mt-5 min-h-6">
        {notice && <p className="mb-3 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">{notice}</p>}
        {loading && <p className="text-sm text-muted">Завантажуємо вільний час…</p>}
        {!loading && error && (
          <p className="text-sm text-red-400">
            {error}{' '}
            <button type="button" onClick={onRetry} className="min-h-11 underline underline-offset-4">
              Спробувати ще раз
            </button>
          </p>
        )}
        {!loading && !error && date && starts.length === 0 && <p className="text-sm text-muted">На цей день вільних місць немає</p>}
        {!date && <p className="text-sm text-muted">Оберіть день, щоб побачити вільний час.</p>}
      </div>

      {starts.length > 0 && !loading && (
        <div role="radiogroup" aria-label="Вільний час" onKeyDown={radioKeyDown} className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {starts.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={s === slot}
              tabIndex={s === tabSlot ? 0 : -1}
              onClick={() => onSlot(s)}
              className={cn(
                'min-h-12 rounded-xl border text-base font-medium tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                s === slot ? 'border-white/70 bg-panel-2' : 'border-line bg-bg hover:border-white/30',
              )}
            >
              {formatTime(s)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
