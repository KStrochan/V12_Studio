import { requireOwner } from '@/lib/auth-server'
import type { BookingStatus } from '@/lib/booking-transitions'
import { kyivDay, type BookingView } from '@/lib/admin-bookings-ui'
import { BookingsView } from './BookingsView'

type Row = {
  id: string
  status: BookingStatus
  start_at: string
  end_at: string
  post_no: number
  car_make: string | null
  car_model: string | null
  car_year: number | null
  comment: string | null
  source: string
  services: { title: string } | null
  clients: { name: string; phone: string } | null
}

const DAY = 86_400_000

export default async function Page() {
  const { supabase } = await requireOwner() // session client: RLS applies, no service role
  const now = Date.now()
  const [rows, services, settings] = await Promise.all([
    supabase
      .from('bookings')
      .select(
        'id,status,start_at,end_at,post_no,car_make,car_model,car_year,comment,source,services(title),clients(name,phone)',
      )
      .gte('start_at', new Date(now - 30 * DAY).toISOString())
      .lt('start_at', new Date(now + 120 * DAY).toISOString())
      .order('start_at', { ascending: true })
      .limit(1000)
      .overrideTypes<Row[], { merge: false }>(),
    supabase.from('services').select('id,title,duration_min').eq('active', true).order('sort_order'),
    supabase.from('settings').select('posts').limit(1).maybeSingle(),
  ])

  if (rows.error || services.error) {
    return (
      <div className="space-y-2">
        <h1 className="font-heading text-2xl">Записи</h1>
        <p role="alert" className="text-red-400">Не вдалося завантажити записи. Спробуйте оновити сторінку.</p>
      </div>
    )
  }

  const bookings: BookingView[] = (rows.data ?? []).map((r) => ({
    id: r.id,
    status: r.status,
    start: r.start_at,
    end: r.end_at,
    postNo: r.post_no,
    service: r.services?.title ?? 'Послуга',
    clientName: r.clients?.name ?? '—',
    phone: r.clients?.phone ?? '',
    car: [r.car_make, r.car_model].filter(Boolean).join(' '),
    carYear: r.car_year,
    comment: r.comment ?? '',
    source: r.source,
  }))

  return (
    <BookingsView
      bookings={bookings}
      services={(services.data ?? []).map((s) => ({
        id: s.id as string,
        title: s.title as string,
        durationMin: s.duration_min as number,
      }))}
      posts={(settings.data?.posts as number | undefined) ?? 2}
      today={kyivDay(new Date())}
    />
  )
}
