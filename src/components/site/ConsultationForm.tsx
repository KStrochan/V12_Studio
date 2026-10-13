'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

type Errors = Partial<Record<'name' | 'phone' | 'question' | '_', string>>
type Status = 'idle' | 'sending' | 'done'

const field =
  'mt-2 block min-h-12 w-full rounded-xl border border-line bg-bg px-4 text-base text-fg placeholder:text-white/30 focus:border-white/60 focus:outline-none aria-[invalid=true]:border-red-400'

export function ConsultationForm({ telegramUrl, viberUrl }: { telegramUrl?: string; viberUrl?: string }) {
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<Errors>({})
  const formRef = useRef<HTMLFormElement>(null)
  const doneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const first = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
    first?.focus()
  }, [errors])

  useEffect(() => {
    if (status === 'done') doneRef.current?.focus()
  }, [status])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'sending') return
    const form = e.currentTarget
    const fd = new FormData(form)
    setStatus('sending')
    setErrors({})
    try {
      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('name'),
          phone: fd.get('phone'),
          question: fd.get('question') || undefined,
          website: fd.get('website') || undefined,
        }),
      })
      if (res.ok) {
        form.reset()
        setStatus('done')
        return
      }
      const data = (await res.json().catch(() => ({}))) as { errors?: Errors; error?: string }
      setErrors(data.errors ?? { _: data.error ?? 'Не вдалося надіслати. Спробуйте ще раз або зателефонуйте нам.' })
    } catch {
      setErrors({ _: 'Немає зʼєднання. Спробуйте ще раз або зателефонуйте нам.' })
    }
    setStatus('idle')
  }

  const err = (k: keyof Errors) => (errors[k] ? `consult-${k}-err` : undefined)

  return (
    <section id="consultation" className="scroll-mt-20 border-t border-line px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
        <div>
          <SectionHeading
            eyebrow="Консультація"
            title="Не впевнені, що з авто?"
            lead="Залиште номер, і ми передзвонимо та підкажемо, з чого почати. Безкоштовно."
          />
          {(telegramUrl || viberUrl) && (
            <Reveal delay={0.15} className="mt-8 flex flex-wrap gap-3">
              {telegramUrl && (
                <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="chrome-border inline-flex min-h-12 items-center justify-center rounded-full px-7 text-sm font-semibold hover:bg-panel-2">
                  Telegram
                </a>
              )}
              {viberUrl && (
                <a href={viberUrl} className="chrome-border inline-flex min-h-12 items-center justify-center rounded-full px-7 text-sm font-semibold hover:bg-panel-2">
                  Viber
                </a>
              )}
            </Reveal>
          )}
        </div>

        <Reveal delay={0.1} className="rounded-2xl border border-line bg-panel p-6 sm:p-8">
          {status === 'done' ? (
            <div ref={doneRef} tabIndex={-1} role="status" className="py-10 text-center outline-none">
              <p className="chrome-text font-heading text-xl font-semibold uppercase tracking-wider">Дякуємо!</p>
              <p className="mt-3 text-sm text-muted">Заявку отримано. Ми зателефонуємо вам найближчим часом.</p>
              <button type="button" onClick={() => setStatus('idle')} className="mt-6 min-h-11 text-sm text-white/70 underline underline-offset-4">
                Надіслати ще одну
              </button>
            </div>
          ) : (
            <form ref={formRef} onSubmit={onSubmit} noValidate className="relative space-y-5" aria-label="Форма консультації">
              <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
                <label>
                  Website
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              <div>
                <label htmlFor="consult-name" className="text-sm text-white/80">Ім&apos;я</label>
                <input id="consult-name" name="name" autoComplete="name" required className={field} aria-invalid={!!errors.name} aria-describedby={err('name')} />
                {errors.name && <p id="consult-name-err" role="alert" className="mt-1.5 text-sm text-red-400">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="consult-phone" className="text-sm text-white/80">Телефон</label>
                <input id="consult-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+380 __ ___ __ __" required className={field} aria-invalid={!!errors.phone} aria-describedby={err('phone')} />
                {errors.phone && <p id="consult-phone-err" role="alert" className="mt-1.5 text-sm text-red-400">{errors.phone}</p>}
              </div>
              <div>
                <label htmlFor="consult-question" className="text-sm text-white/80">Питання (необов&apos;язково)</label>
                <textarea id="consult-question" name="question" rows={3} maxLength={500} className={`${field} py-3`} aria-invalid={!!errors.question} aria-describedby={err('question')} />
                {errors.question && <p id="consult-question-err" role="alert" className="mt-1.5 text-sm text-red-400">{errors.question}</p>}
              </div>
              {errors._ && <p role="alert" className="text-sm text-red-400">{errors._}</p>}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[image:var(--chrome)] px-7 text-sm font-semibold text-black disabled:opacity-60"
              >
                {status === 'sending' ? 'Надсилаємо…' : 'Передзвоніть мені'}
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  )
}
