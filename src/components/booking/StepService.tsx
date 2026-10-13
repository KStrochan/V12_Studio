'use client'

import type { SiteService } from '@/lib/content'
import { cn } from '@/lib/cn'
import { radioKeyDown } from './radio'

const money = new Intl.NumberFormat('uk-UA')

export function StepService({ services, value, onSelect }: { services: SiteService[]; value?: string; onSelect: (s: SiteService) => void }) {
  const tabStop = services.some((s) => s.id === value) ? value : services[0]?.id
  return (
    <div role="radiogroup" aria-labelledby="booking-step-title" onKeyDown={radioKeyDown} className="grid gap-3 sm:grid-cols-2">
      {services.map((s) => {
        const checked = s.id === value
        return (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={s.id === tabStop ? 0 : -1}
            onClick={() => onSelect(s)}
            className={cn(
              'flex min-h-14 flex-col items-start rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
              checked ? 'border-white/70 bg-panel-2' : 'border-line bg-bg hover:border-white/30',
            )}
          >
            <span className="font-heading text-sm font-semibold uppercase tracking-wider">{s.title}</span>
            <span className="mt-1 text-sm text-muted">
              від {money.format(s.price_from)} грн · ≈ {s.duration_min} хв
            </span>
          </button>
        )
      })}
    </div>
  )
}
