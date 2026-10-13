import { TZDate } from '@date-fns/tz'
import { requireOwner } from '@/lib/auth-server'
import { BUSINESS_TZ } from '@/lib/slots'

function dayRange(offset: number) {
  const now = new TZDate(new Date(), BUSINESS_TZ)
  const from = new TZDate(now.getFullYear(), now.getMonth(), now.getDate() + offset, BUSINESS_TZ)
  const to = new TZDate(now.getFullYear(), now.getMonth(), now.getDate() + offset + 1, BUSINESS_TZ)
  return { from: new Date(from.getTime()).toISOString(), to: new Date(to.getTime()).toISOString() }
}

export default async function OverviewPage() {
  const { supabase } = await requireOwner() // session client: RLS applies, no service role
  const today = dayRange(0)
  const tomorrow = dayRange(1)
  const activeDay = (r: { from: string; to: string }) =>
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'confirmed'])
      .gte('start_at', r.from)
      .lt('start_at', r.to)

  const [pending, td, tm, cons] = await Promise.all([
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    activeDay(today),
    activeDay(tomorrow),
    supabase.from('consultations').select('id', { count: 'exact', head: true }).eq('status', 'new'),
  ])
  const failed = [pending, td, tm, cons].some((r) => r.error)
  const cards = [
    { label: 'Нові заявки', value: pending.count },
    { label: 'Записи сьогодні', value: td.count },
    { label: 'Записи завтра', value: tm.count },
    { label: 'Нові консультації', value: cons.count },
  ]
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl">Огляд</h1>
      {failed ? (
        <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Не вдалося завантажити частину даних.
        </p>
      ) : null}
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-line bg-panel p-4">
            <dt className="text-sm text-muted">{c.label}</dt>
            <dd className="mt-2 text-3xl font-semibold" data-testid="counter">
              {c.value ?? '—'}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
