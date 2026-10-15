'use client'

import { useState } from 'react'
import { AdminDialog, btnCls, btnPrimaryCls, fieldCls } from '@/components/admin/AdminDialog'
import { carYearOptions } from '@/lib/car-year'
import { kyivToIso, type ServiceOption } from '@/lib/admin-bookings-ui'

export function ManualBookingDialog({
  services,
  posts,
  defaultDay,
  onClose,
  onDone,
}: {
  services: ServiceOption[]
  posts: number
  defaultDay: string
  onClose: () => void
  onDone: () => void
}) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const post = String(f.get('postNo') ?? '')
    const payload = {
      serviceId: f.get('serviceId'),
      start: kyivToIso(String(f.get('day')), String(f.get('time'))),
      name: f.get('name'),
      phone: f.get('phone'),
      carMake: f.get('carMake'),
      carModel: f.get('carModel'),
      ...(f.get('carYear') ? { carYear: Number(f.get('carYear')) } : {}),
      comment: f.get('comment'),
      ...(post ? { postNo: Number(post) } : {}),
    }
    setErrors({})
    setSaving(true)
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        errors?: Record<string, string>
      }
      if (res.ok) return onDone()
      setErrors(data.errors ?? { _: data.error ?? 'Не вдалося створити запис' })
    } catch {
      setErrors({ _: 'Немає зв’язку із сервером' })
    } finally {
      setSaving(false)
    }
  }

  const err = (k: string) =>
    errors[k] ? (
      <span role="alert" className="mt-1 block text-xs text-red-400">
        {errors[k]}
      </span>
    ) : null

  return (
    <AdminDialog title="Новий запис" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm">
          Послуга
          <select name="serviceId" required className={fieldCls} defaultValue={services[0]?.id}>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.durationMin} хв)
              </option>
            ))}
          </select>
          {err('serviceId')}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Дата
            <input name="day" type="date" required defaultValue={defaultDay} className={fieldCls} />
          </label>
          <label className="block text-sm">
            Час
            <input name="time" type="time" step={300} required defaultValue="10:00" className={fieldCls} />
          </label>
        </div>
        {err('start')}
        <label className="block text-sm">
          Пост
          <select name="postNo" className={fieldCls} defaultValue="">
            <option value="">Будь-який вільний</option>
            {Array.from({ length: posts }, (_, i) => i + 1).map((p) => (
              <option key={p} value={p}>
                Пост {p}
              </option>
            ))}
          </select>
          {err('postNo')}
        </label>
        <label className="block text-sm">
          Ім’я
          <input name="name" required autoComplete="off" className={fieldCls} />
          {err('name')}
        </label>
        <label className="block text-sm">
          Телефон
          <input name="phone" type="tel" required inputMode="tel" autoComplete="off" placeholder="050 123 45 67" className={fieldCls} />
          {err('phone')}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Марка
            <input name="carMake" className={fieldCls} />
          </label>
          <label className="block text-sm">
            Модель
            <input name="carModel" className={fieldCls} />
          </label>
        </div>
        <label className="block text-sm">
          Рік випуску (необов’язково)
          <select name="carYear" className={fieldCls} defaultValue="">
            <option value="">Не вказано</option>
            {carYearOptions().map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          {err('carYear')}
        </label>
        <label className="block text-sm">
          Коментар
          <textarea name="comment" rows={2} className={`${fieldCls} py-2`} />
          {err('comment')}
        </label>
        {err('_')}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnCls}>
            Скасувати
          </button>
          <button type="submit" disabled={saving} className={btnPrimaryCls}>
            {saving ? 'Зберігаємо…' : 'Створити запис'}
          </button>
        </div>
      </form>
    </AdminDialog>
  )
}
