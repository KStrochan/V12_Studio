import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireOwner } from '@/lib/auth-server'
import { uuidSchema } from '@/lib/admin-schemas'
import { kyivDay, kyivLongDay, kyivTime } from '@/lib/admin-bookings-ui'
import { STATUS_LABEL, type BookingStatus } from '@/lib/booking-transitions'
import { ClientNotes } from './ClientNotes'

type Visit = {
  id: string
  start_at: string
  status: BookingStatus
  car_make: string | null
  car_model: string | null
  services: { title: string } | null
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireOwner()
  const { id } = await params
  if (!uuidSchema.safeParse(id).success) notFound()

  const [client, visits] = await Promise.all([
    supabase.from('clients').select('id,name,phone,car,notes').eq('id', id).maybeSingle(),
    supabase
      .from('bookings')
      .select('id,start_at,status,car_make,car_model,services(title)')
      .eq('client_id', id)
      .order('start_at', { ascending: false })
      .limit(200)
      .overrideTypes<Visit[], { merge: false }>(),
  ])
  if (client.error || visits.error) {
    return (
      <div className="space-y-2">
        <h1 className="font-heading text-2xl">Клієнт</h1>
        <p role="alert" className="text-red-400">Не вдалося завантажити клієнта. Спробуйте оновити сторінку.</p>
      </div>
    )
  }
  if (!client.data) notFound()
  const c = client.data

  return (
    <div className="space-y-6">
      <Link href="/admin/clients" className="inline-flex min-h-11 items-center text-sm text-muted underline">
        ← Усі клієнти
      </Link>
      <div>
        <h1 className="font-heading text-2xl">{c.name}</h1>
        <a href={`tel:${c.phone}`} className="inline-flex min-h-11 items-center underline">
          {c.phone}
        </a>
        {c.car ? <p className="text-sm text-muted">{c.car}</p> : null}
      </div>

      <ClientNotes id={c.id as string} initial={(c.notes as string) ?? ''} />

      <section aria-labelledby="visits-h" className="space-y-3">
        <h2 id="visits-h" className="font-heading text-xl">Історія візитів</h2>
        {(visits.data ?? []).length === 0 ? (
          <p className="text-muted">Візитів ще немає.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {(visits.data ?? []).map((v) => (
              <li key={v.id} data-testid="visit" className="list-none rounded-xl border border-line bg-panel p-4">
                <p className="font-heading">
                  {kyivLongDay(kyivDay(v.start_at))}, {kyivTime(v.start_at)}
                </p>
                <p className="text-sm text-muted">
                  {v.services?.title ?? 'Послуга'} · {STATUS_LABEL[v.status] ?? v.status}
                </p>
                {v.car_make || v.car_model ? (
                  <p className="text-sm text-muted">{[v.car_make, v.car_model].filter(Boolean).join(' ')}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
