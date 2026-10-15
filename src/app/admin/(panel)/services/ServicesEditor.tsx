'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { btnPrimaryCls, fieldCls } from '@/components/admin/AdminDialog'
import { alertCls, sendJson } from '@/components/admin/send'
import { serviceIcons } from '@/components/icons/ServiceIcons'

export type ServiceRow = {
  id: string | null
  title: string
  description: string
  price_from: number
  duration_min: number
  icon: string
  sort_order: number
  active: boolean
}

const ICON_LABELS: Record<string, string> = {
  scan: 'Діагностика',
  suspension: 'Ходова',
  oil: 'ТО (масло)',
  engine: 'Двигун',
  bolt: 'Електрика',
  brake: 'Гальма',
  body: 'Кузов',
  tire: 'Шиномонтаж',
}

const labelCls = 'block space-y-1 text-sm text-muted'

function ServiceForm({ initial, onSaved }: { initial: ServiceRow; onSaved: () => void }) {
  const router = useRouter()
  const isNew = initial.id === null
  const [f, setF] = useState({
    ...initial,
    duration_min: String(initial.duration_min),
    sort_order: String(initial.sort_order),
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => {
    setF((p) => ({ ...p, [k]: v }))
    setSaved(false)
  }
  const num = (v: string) => (v.trim() === '' ? NaN : Number(v))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const payload = {
      title: f.title,
      description: f.description,
      duration_min: num(f.duration_min),
      icon: f.icon,
      sort_order: num(f.sort_order),
      active: f.active,
    }
    const r = await sendJson(isNew ? '/api/admin/services' : `/api/admin/services/${initial.id}`, isNew ? 'POST' : 'PATCH', payload)
    setBusy(false)
    if (!r.ok) return setError(r.error)
    setSaved(true)
    if (isNew) onSaved()
    router.refresh()
  }

  const id = initial.id ?? 'new'
  return (
    <form
      onSubmit={submit}
      data-testid={isNew ? 'service-new' : 'service-card'}
      data-service-id={initial.id ?? undefined}
      aria-label={isNew ? 'Нова послуга' : `Послуга ${initial.title}`}
      className="space-y-3 rounded-xl border border-line bg-panel p-4"
    >
      <label className={labelCls}>
        Назва
        <input className={fieldCls} value={f.title} maxLength={80} onChange={(e) => set('title', e.target.value)} />
      </label>
      <label className={labelCls}>
        Опис
        <textarea className={`${fieldCls} py-2`} rows={3} maxLength={500} value={f.description} onChange={(e) => set('description', e.target.value)} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={labelCls}>
          Тривалість, хв
          <input className={fieldCls} type="number" inputMode="numeric" min={5} step={5} value={f.duration_min} onChange={(e) => set('duration_min', e.target.value)} />
        </label>
        <label className={labelCls}>
          Порядок
          <input className={fieldCls} type="number" inputMode="numeric" step={1} value={f.sort_order} onChange={(e) => set('sort_order', e.target.value)} />
        </label>
        <label className={labelCls}>
          Іконка
          <select className={fieldCls} value={f.icon} onChange={(e) => set('icon', e.target.value)}>
            {!(f.icon in serviceIcons) ? <option value={f.icon}>{f.icon} (за замовчуванням)</option> : null}
            {Object.keys(serviceIcons).map((n) => (
              <option key={n} value={n}>
                {ICON_LABELS[n] ?? n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input type="checkbox" className="size-5" checked={f.active} onChange={(e) => set('active', e.target.checked)} />
        Показувати на сайті
      </label>
      {error ? <p role="alert" className={alertCls}>{error}</p> : null}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy} id={`save-${id}`} className={btnPrimaryCls}>
          {isNew ? 'Додати послугу' : 'Зберегти'}
        </button>
        {saved ? <p role="status" className="text-sm text-muted">Збережено</p> : null}
      </div>
    </form>
  )
}

export function ServicesEditor({ services }: { services: ServiceRow[] }) {
  const [formKey, setFormKey] = useState(0)
  const blank: ServiceRow = {
    id: null,
    title: '',
    description: '',
    price_from: 0,
    duration_min: 60,
    icon: 'scan',
    sort_order: (services.reduce((m, s) => Math.max(m, s.sort_order), 0) || 0) + 10,
    active: true,
  }
  return (
    <div className="space-y-6">
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Послуги">
        {services.map((s) => (
          <li key={s.id} className="list-none">
            <ServiceForm initial={s} onSaved={() => {}} />
          </li>
        ))}
      </ul>
      <section aria-labelledby="new-service-h" className="max-w-xl space-y-3">
        <h2 id="new-service-h" className="font-heading text-xl">Нова послуга</h2>
        <ServiceForm key={formKey} initial={blank} onSaved={() => setFormKey((k) => k + 1)} />
      </section>
    </div>
  )
}
