import Link from 'next/link'
import { requireOwner } from '@/lib/auth-server'
import { buildClientSearch } from '@/lib/admin-schemas'
import { btnPrimaryCls, fieldCls } from '@/components/admin/AdminDialog'

type Client = { id: string; name: string; phone: string; car: string | null }

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const { supabase } = await requireOwner()
  const sp = await searchParams
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q) ?? ''
  const s = buildClientSearch(q)

  const base = () => supabase.from('clients').select('id,name,phone,car').order('name').limit(200)
  const queries = []
  if (!s.name) queries.push(base())
  else {
    queries.push(base().ilike('name', s.name))
    if (s.phone) queries.push(base().ilike('phone', s.phone))
  }
  const results = await Promise.all(queries)
  const failed = results.some((r) => r.error)
  const seen = new Map<string, Client>()
  for (const r of results) for (const c of (r.data ?? []) as Client[]) seen.set(c.id, c)
  const clients = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name, 'uk'))

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl">Клієнти</h1>
      <form role="search" method="get" className="flex flex-wrap gap-2">
        <label htmlFor="client-q" className="sr-only">
          Пошук за іменем або телефоном
        </label>
        <input
          id="client-q"
          name="q"
          type="search"
          defaultValue={q.slice(0, 40)}
          maxLength={40}
          placeholder="Ім’я або частина телефону"
          className={`${fieldCls} max-w-sm flex-1`}
        />
        <button type="submit" className={btnPrimaryCls}>
          Знайти
        </button>
      </form>
      {failed ? (
        <p role="alert" className="text-red-400">Не вдалося завантажити клієнтів. Спробуйте оновити сторінку.</p>
      ) : clients.length === 0 ? (
        <p className="text-muted">{q ? 'Нікого не знайдено.' : 'Клієнтів ще немає.'}</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Клієнти">
          {clients.map((c) => (
            <li key={c.id} data-testid="client-card" className="list-none">
              <Link
                href={`/admin/clients/${c.id}`}
                className="block min-h-11 rounded-xl border border-line bg-panel p-4 hover:bg-panel-2"
              >
                <p className="font-heading text-lg">{c.name}</p>
                <p className="text-sm text-muted">{c.phone}</p>
                {c.car ? <p className="text-sm text-muted">{c.car}</p> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
