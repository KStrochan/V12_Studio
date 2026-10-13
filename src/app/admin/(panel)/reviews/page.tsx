import { requireOwner } from '@/lib/auth-server'
import { ReviewsManager, type ReviewRow } from './ReviewsManager'

export default async function Page() {
  const { supabase } = await requireOwner()
  const { data, error } = await supabase
    .from('reviews')
    .select('id,author,body,rating,visible')
    .order('created_at', { ascending: false })
    .limit(300)
  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="font-heading text-2xl">Відгуки</h1>
        <p role="alert" className="text-red-400">Не вдалося завантажити відгуки. Спробуйте оновити сторінку.</p>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl">Відгуки</h1>
      <ReviewsManager reviews={(data ?? []) as ReviewRow[]} />
    </div>
  )
}
