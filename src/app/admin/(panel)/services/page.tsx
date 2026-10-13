import { requireOwner } from '@/lib/auth-server'
import { ServicesEditor, type ServiceRow } from './ServicesEditor'

export default async function Page() {
  const { supabase } = await requireOwner()
  const { data, error } = await supabase
    .from('services')
    .select('id,title,description,price_from,duration_min,icon,sort_order,active')
    .order('sort_order')
  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="font-heading text-2xl">Послуги</h1>
        <p role="alert" className="text-red-400">Не вдалося завантажити послуги. Спробуйте оновити сторінку.</p>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl">Послуги</h1>
      <ServicesEditor services={(data ?? []) as ServiceRow[]} />
    </div>
  )
}
