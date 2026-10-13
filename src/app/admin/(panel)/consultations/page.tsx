import { requireOwner } from '@/lib/auth-server'
import { ConsultationList, type ConsultationView } from './ConsultationList'

const fmt = new Intl.DateTimeFormat('uk-UA', {
  timeZone: 'Europe/Kyiv',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export default async function Page() {
  const { supabase } = await requireOwner()
  const { data, error } = await supabase
    .from('consultations')
    .select('id,name,phone,question,status,created_at')
    .order('created_at', { ascending: false })
    .limit(300)

  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="font-heading text-2xl">Консультації</h1>
        <p role="alert" className="text-red-400">Не вдалося завантажити консультації. Спробуйте оновити сторінку.</p>
      </div>
    )
  }
  // New first (stable sort keeps newest-first within each group).
  const items: ConsultationView[] = (data ?? [])
    .map((c) => ({
      id: c.id as string,
      name: c.name as string,
      phone: c.phone as string,
      question: (c.question as string | null) ?? '',
      status: (c.status === 'handled' ? 'handled' : 'new') as 'new' | 'handled',
      created: fmt.format(new Date(c.created_at as string)),
    }))
    .sort((a, b) => Number(b.status === 'new') - Number(a.status === 'new'))

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl">Консультації</h1>
      <ConsultationList items={items} />
    </div>
  )
}
