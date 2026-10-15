import { requireOwnerApi } from '@/lib/auth-server'
import { fail, serverError } from '@/lib/admin-api'
import { exportTypeSchema } from '@/lib/admin-schemas'
import { toCsv } from '@/lib/csv'
import { EXPORT_TOO_LARGE, fetchAll } from '@/lib/paginate'
import { kyivDay, kyivTime } from '@/lib/admin-bookings-ui'
import { STATUS_LABEL, type BookingStatus } from '@/lib/booking-transitions'


type BookingRow = {
  start_at: string
  post_no: number
  status: BookingStatus
  car_make: string | null
  car_model: string | null
  car_year: number | null
  comment: string | null
  source: string
  services: { title: string } | null
  clients: { name: string; phone: string } | null
}

export async function GET(request: Request) {
  const auth = await requireOwnerApi()
  if (!auth.ok) return auth.response
  const type = exportTypeSchema.safeParse(new URL(request.url).searchParams.get('type'))
  if (!type.success) return fail('Невірний тип експорту')

  try {
    let csv: string
    if (type.data === 'bookings') {
      const data = await fetchAll<BookingRow>((from, to) =>
        auth.supabase
          .from('bookings')
        .select('start_at,post_no,status,car_make,car_model,car_year,comment,source,services(title),clients(name,phone)')
        .order('start_at', { ascending: false })
          .order('id')
          .range(from, to)
          .overrideTypes<BookingRow[], { merge: false }>(),
      )
      csv = toCsv(
        data.map((b) => ({
          Дата: kyivDay(b.start_at),
          Час: kyivTime(b.start_at),
          Послуга: b.services?.title ?? null,
          Клієнт: b.clients?.name ?? null,
          Телефон: b.clients?.phone ?? null,
          Авто: [b.car_make, b.car_model].filter(Boolean).join(' ') || null,
          'Рік авто': b.car_year,
          Пост: b.post_no,
          Статус: STATUS_LABEL[b.status] ?? b.status,
          Коментар: b.comment,
          Джерело: b.source,
        })),
      )
    } else {
      const data = await fetchAll<Record<string, unknown>>((from, to) =>
        auth.supabase.from('clients').select('name,phone,car,notes,created_at').order('name').order('id').range(from, to),
      )
      csv = toCsv(
        data.map((c) => ({
          'Ім’я': c.name as string,
          Телефон: c.phone as string,
          Авто: (c.car as string | null) || null,
          Нотатки: (c.notes as string) || null,
          Створено: kyivDay(c.created_at as string),
        })),
      )
    }
    return new Response(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="${type.data}-${kyivDay(new Date())}.csv"`,
        'cache-control': 'no-store',
      },
    })
  } catch (e) {
    if (e instanceof Error && e.message === EXPORT_TOO_LARGE) return fail('Забагато записів для експорту. Оберіть менший обсяг.', 413)
    return serverError('GET /api/admin/export', e)
  }
}
