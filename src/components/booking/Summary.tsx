import type { SiteService } from '@/lib/content'
import { formatTime } from './dates'

const dateFmt = new Intl.DateTimeFormat('uk-UA', { timeZone: 'Europe/Kyiv', weekday: 'long', day: 'numeric', month: 'long' })

export function Summary({ service, slot, car }: { service?: SiteService; slot?: string; car?: string }) {
  const rows: [string, string | undefined][] = [
    ['Послуга', service?.title],
    ['Дата', slot ? dateFmt.format(new Date(slot)) : undefined],
    ['Час', slot ? formatTime(slot) : undefined],
    ['Авто', car || undefined],
  ]
  return (
    <aside aria-label="Підсумок запису" data-testid="booking-summary" className="rounded-2xl border border-line bg-panel p-6">
      <h3 className="font-heading text-sm font-semibold uppercase tracking-wider">Ваш запис</h3>
      <dl className="mt-5 space-y-4 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-muted">{k}</dt>
            <dd className={v ? 'text-right text-fg' : 'text-right text-white/30'}>{v ?? '—'}</dd>
          </div>
        ))}
      </dl>
    </aside>
  )
}
