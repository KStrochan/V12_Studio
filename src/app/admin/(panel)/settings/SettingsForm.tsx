'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { btnPrimaryCls, fieldCls } from '@/components/admin/AdminDialog'
import { alertCls, sendJson } from '@/components/admin/send'
import type { DayHours, WorkingHours } from '@/lib/slots'

export type SettingsValues = {
  phone: string
  address: string
  socials: Record<string, string>
  working_hours: WorkingHours
  posts: number
  step_min: number
  min_lead_min: number
}

const NETWORKS = [
  ['instagram', 'Instagram'],
  ['facebook', 'Facebook'],
  ['telegram', 'Telegram'],
  ['tiktok', 'TikTok'],
  ['youtube', 'YouTube'],
] as const

// Monday-first display of JS weekday keys.
const DAYS = [
  ['1', 'Понеділок'],
  ['2', 'Вівторок'],
  ['3', 'Середа'],
  ['4', 'Четвер'],
  ['5', 'Пʼятниця'],
  ['6', 'Субота'],
  ['0', 'Неділя'],
] as const

const labelCls = 'block space-y-1 text-sm text-muted'

export function SettingsForm({ initial }: { initial: SettingsValues }) {
  const router = useRouter()
  const [phone, setPhone] = useState(initial.phone)
  const [address, setAddress] = useState(initial.address)
  const [socials, setSocials] = useState<Record<string, string>>(initial.socials)
  const [hours, setHours] = useState<WorkingHours>(initial.working_hours)
  const [posts, setPosts] = useState(String(initial.posts))
  const [step, setStep] = useState(String(initial.step_min))
  const [lead, setLead] = useState(String(initial.min_lead_min))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const setDay = (k: keyof WorkingHours, v: DayHours) => {
    setHours((h) => ({ ...h, [k]: v }))
    setSaved(false)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const cleanSocials = Object.fromEntries(
      Object.entries(socials)
        .map(([k, v]) => [k, v.trim()] as const)
        .filter(([, v]) => v !== ''),
    )
    const num = (v: string) => (v.trim() === '' ? NaN : Number(v))
    const r = await sendJson('/api/admin/settings', 'PATCH', {
      phone,
      address,
      socials: cleanSocials,
      working_hours: hours,
      posts: num(posts),
      step_min: num(step),
      min_lead_min: num(lead),
    })
    setBusy(false)
    if (!r.ok) return setError(r.error)
    setSaved(true)
    router.refresh()
  }

  return (
    <form onSubmit={submit} aria-label="Налаштування" className="max-w-xl space-y-6" onChange={() => setSaved(false)}>
      <section className="space-y-3">
        <h2 className="font-heading text-xl">Контакти</h2>
        <label className={labelCls}>
          Телефон
          <input className={fieldCls} type="tel" value={phone} maxLength={30} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label className={labelCls}>
          Адреса
          <input className={fieldCls} value={address} maxLength={200} onChange={(e) => setAddress(e.target.value)} />
        </label>
        {NETWORKS.map(([key, label]) => (
          <label key={key} className={labelCls}>
            {label} (https://…)
            <input
              className={fieldCls}
              type="url"
              inputMode="url"
              value={socials[key] ?? ''}
              maxLength={200}
              placeholder="https://"
              onChange={(e) => setSocials((s) => ({ ...s, [key]: e.target.value }))}
            />
          </label>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl">Графік роботи</h2>
        {DAYS.map(([k, label]) => {
          const h = hours[k]
          return (
            <div key={k} className="flex flex-wrap items-center gap-2" data-testid={`hours-${k}`}>
              <span className="w-28 text-sm">{label}</span>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-5"
                  checked={h !== null}
                  onChange={(e) => setDay(k, e.target.checked ? { open: '09:00', close: '18:00' } : null)}
                />
                Працюємо
              </label>
              {h ? (
                <>
                  <input
                    type="time"
                    aria-label={`${label}: відкриття`}
                    className={`${fieldCls} w-auto`}
                    value={h.open}
                    onChange={(e) => setDay(k, { ...h, open: e.target.value })}
                  />
                  <span aria-hidden>–</span>
                  <input
                    type="time"
                    aria-label={`${label}: закриття`}
                    className={`${fieldCls} w-auto`}
                    value={h.close}
                    onChange={(e) => setDay(k, { ...h, close: e.target.value })}
                  />
                </>
              ) : (
                <span className="text-sm text-muted">вихідний</span>
              )}
            </div>
          )
        })}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl">Запис</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className={labelCls}>
            Кількість постів
            <input className={fieldCls} type="number" inputMode="numeric" min={1} max={20} value={posts} onChange={(e) => setPosts(e.target.value)} />
          </label>
          <label className={labelCls}>
            Крок слотів, хв
            <input className={fieldCls} type="number" inputMode="numeric" min={5} max={240} value={step} onChange={(e) => setStep(e.target.value)} />
          </label>
          <label className={labelCls}>
            Мін. запас, хв
            <input className={fieldCls} type="number" inputMode="numeric" min={0} value={lead} onChange={(e) => setLead(e.target.value)} />
          </label>
        </div>
      </section>

      {error ? <p role="alert" className={alertCls}>{error}</p> : null}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy} className={btnPrimaryCls}>
          Зберегти налаштування
        </button>
        {saved ? <p role="status" className="text-sm text-muted">Збережено</p> : null}
      </div>
    </form>
  )
}
