import { requireOwner } from '@/lib/auth-server'
import { mergeSettings } from '@/lib/content'
import { SettingsForm, type SettingsValues } from './SettingsForm'
import { DaysOff, type DayOffRow } from './DaysOff'

const csvLinkCls =
  'inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-4 text-sm hover:bg-panel-2'

export default async function Page() {
  const { supabase } = await requireOwner()
  const [s, d] = await Promise.all([
    supabase.from('settings').select('phone,address,socials,working_hours,posts,step_min,min_lead_min').limit(1).maybeSingle(),
    supabase.from('days_off').select('day,reason').gte('day', new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)).order('day'),
  ])
  if (s.error || d.error) {
    return (
      <div className="space-y-2">
        <h1 className="font-heading text-2xl">Налаштування</h1>
        <p role="alert" className="text-red-400">Не вдалося завантажити налаштування. Спробуйте оновити сторінку.</p>
      </div>
    )
  }
  // Same merge as the public site, but keep an empty phone/address editable as the DB has them.
  const merged = mergeSettings(s.data)
  const row = s.data
  const values: SettingsValues = {
    phone: (row?.phone as string | undefined) ?? '',
    address: (row?.address as string | undefined) ?? '',
    socials: merged.socials,
    working_hours: merged.working_hours,
    posts: (row?.posts as number | undefined) ?? 2,
    step_min: (row?.step_min as number | undefined) ?? 30,
    min_lead_min: (row?.min_lead_min as number | undefined) ?? 60,
  }

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-2xl">Налаштування</h1>
      <SettingsForm initial={values} />
      <DaysOff days={(d.data ?? []) as DayOffRow[]} />
      <section aria-labelledby="export-h" className="space-y-3">
        <h2 id="export-h" className="font-heading text-xl">Експорт у CSV</h2>
        <div className="flex flex-wrap gap-2">
          <a href="/api/admin/export?type=bookings" download className={csvLinkCls}>
            Записи
          </a>
          <a href="/api/admin/export?type=clients" download className={csvLinkCls}>
            Клієнти
          </a>
        </div>
      </section>
    </div>
  )
}
