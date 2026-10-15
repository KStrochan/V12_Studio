'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { SiteService } from '@/lib/content'
import { normalizeUaPhone } from '@/lib/phone'
import { buildCalendarEvent, buildIcs, googleCalendarUrl, type CalendarEvent } from '@/lib/calendar'
import { SectionHeading } from '@/components/site/SectionHeading'
import { StepService } from './StepService'
import { StepSlot } from './StepSlot'
import { StepContacts, type ContactErrors, type Contacts } from './StepContacts'
import { Summary } from './Summary'
import { kyivDays, type Day } from './dates'
import { normalizeServerErrors } from './errors'
import { useSlots, type Slot } from './useSlots'

type WorkingHours = Record<string, { open: string; close: string } | null>

const TITLES = ['Оберіть послугу', 'Дата й час', 'Ваші контакти']
const EMPTY: Contacts = { name: '', phone: '', carMake: '', carModel: '', carYear: '', comment: '' }

const btnPrimary =
  'inline-flex min-h-12 min-w-0 flex-1 items-center justify-center rounded-full bg-[image:var(--chrome)] px-5 text-center text-sm font-semibold text-black disabled:opacity-40 lg:flex-none'
const btnGhost = 'chrome-border inline-flex min-h-12 min-w-0 items-center justify-center rounded-full px-5 text-center text-sm font-semibold hover:bg-panel-2'

function focusFirstInvalid() {
  requestAnimationFrame(() =>
    (document.querySelector<HTMLElement>('#booking-form [aria-invalid="true"]') ?? document.getElementById('booking-general-err'))?.focus(),
  )
}


function downloadIcs(ev: CalendarEvent) {
  const blob = new Blob([buildIcs(ev)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'v12-service-zapys.ics'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function BookingWizard({
  services,
  workingHours,
  address,
  phone,
}: {
  services: SiteService[]
  workingHours: WorkingHours
  address?: string
  phone?: string
}) {
  const reduce = useReducedMotion()
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const [calendarEvent, setCalendarEvent] = useState<CalendarEvent>()
  const [service, setService] = useState<SiteService>()
  const [days, setDays] = useState<Day[]>([])
  const [date, setDate] = useState<string>()
  const [slot, setSlot] = useState<string>()
  const [emptyDays, setEmptyDays] = useState<Set<string>>(new Set())
  const [notice, setNotice] = useState<string>()
  const [contacts, setContacts] = useState<Contacts>(EMPTY)
  const [errors, setErrors] = useState<ContactErrors>({})
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState('')
  const titleRef = useRef<HTMLHeadingElement>(null)
  const doneRef = useRef<HTMLDivElement>(null)
  const moved = useRef(false)
  const [inView, setInView] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  const { slots, loading, error, refetch, replace } = useSlots(service?.id, date)

  useEffect(() => setDays(kyivDays(14)), [])

  // hide the site's floating CTA while the wizard (with its own sticky bar) is on screen
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const root = document.documentElement
    const io = new IntersectionObserver(([e]) => {
      setInView(e.isIntersecting)
      if (e.isIntersecting) root.dataset.bookingActive = ''
      else delete root.dataset.bookingActive
    })
    io.observe(el)
    return () => {
      io.disconnect()
      delete root.dataset.bookingActive
    }
  }, [])

  const disabledDays = new Set(days.filter((d) => !workingHours[String(d.dow)]).map((d) => d.iso))
  emptyDays.forEach((d) => disabledDays.add(d))

  // lazy availability check: a day that loaded with no slots is shown as unavailable in the strip
  useEffect(() => {
    if (!date || loading || error) return
    if (slots.length === 0) setEmptyDays((s) => (s.has(date) ? s : new Set(s).add(date)))
  }, [date, loading, error, slots.length])

  useEffect(() => {
    if (moved.current) titleRef.current?.focus()
  }, [step])
  useEffect(() => {
    if (done) doneRef.current?.focus()
  }, [done])

  // a chosen slot that vanished from a refreshed list is dropped
  useEffect(() => {
    if (slot && !loading && !error && !slots.some((s) => s.start === slot)) setSlot(undefined)
  }, [slot, slots, loading, error])

  function go(n: number) {
    moved.current = true
    setStep(n)
  }
  function pickService(s: SiteService) {
    if (s.id === service?.id) return
    setService(s)
    setDate(undefined)
    setSlot(undefined)
    setEmptyDays(new Set())
    setNotice(undefined)
  }
  function pickDate(iso: string) {
    setDate(iso)
    setSlot(undefined)
    setNotice(undefined)
  }

  function validate(): ContactErrors {
    const e: ContactErrors = {}
    if (contacts.name.trim().length < 2) e.name = "Ім'я має містити щонайменше 2 символи"
    if (!normalizeUaPhone(contacts.phone)) e.phone = 'Невірний номер телефону'
    if (!contacts.carMake.trim()) e.carMake = 'Вкажіть марку авто'
    if (!contacts.carModel.trim()) e.carModel = 'Вкажіть модель авто'
    if (!contacts.carYear) e.carYear = 'Вкажіть рік випуску авто'
    return e
  }

  async function submit() {
    if (sending || !service || !slot) return
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) {
      focusFirstInvalid()
      return
    }
    setSending(true)
    setStatus('Надсилаємо запит…')
    const honey = document.querySelector<HTMLInputElement>('#booking-form input[name="website"]')?.value
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          start: slot,
          name: contacts.name.trim(),
          phone: contacts.phone,
          carMake: contacts.carMake.trim(),
          carModel: contacts.carModel.trim(),
          carYear: Number(contacts.carYear),
          comment: contacts.comment.trim() || undefined,
          website: honey || undefined,
        }),
      })
      if (res.status === 201) {
        const data = (await res.json().catch(() => ({}))) as { id?: unknown }
        setCalendarEvent(
          buildCalendarEvent({
            bookingId: typeof data.id === 'string' ? data.id : crypto.randomUUID(),
            serviceName: service.title,
            startIso: slot,
            durationMin: service.duration_min,
            address,
            phone,
          }),
        )
        setStatus('')
        setDone(true)
      } else if (res.status === 409) {
        const data = (await res.json().catch(() => ({}))) as { slots?: Slot[] }
        if (Array.isArray(data.slots)) replace(data.slots)
        else refetch()
        setSlot(undefined)
        setNotice('Цей час щойно зайняли. Оберіть інший вільний час.')
        setStatus('Цей час щойно зайняли')
        go(1)
      } else if (res.status === 422) {
        const data = (await res.json().catch(() => ({}))) as { errors?: unknown }
        setErrors(normalizeServerErrors(data.errors))
        setStatus('')
        focusFirstInvalid()
      } else if (res.status === 429) {
        setErrors({ _: 'Забагато спроб. Зачекайте хвилину й спробуйте ще раз. Ваші дані збережено.' })
        setStatus('')
      } else {
        setErrors({ _: 'Не вдалося надіслати. Спробуйте ще раз або зателефонуйте нам.' })
        setStatus('')
      }
    } catch {
      setErrors({ _: 'Немає зʼєднання. Ваші дані збережено, спробуйте ще раз.' })
      setStatus('')
    }
    setSending(false)
  }

  function reset() {
    setDone(false)
    setCalendarEvent(undefined)
    setStep(0)
    setService(undefined)
    setDate(undefined)
    setSlot(undefined)
    setEmptyDays(new Set())
    setNotice(undefined)
    setContacts(EMPTY)
    setErrors({})
    setSending(false)
  }

  const canNext = step === 0 ? !!service : step === 1 ? !!slot : true
  const car = [contacts.carMake.trim(), contacts.carModel.trim(), contacts.carYear].filter(Boolean).join(' ')
  const variants = reduce
    ? { initial: {}, animate: {}, exit: {} }
    : { initial: { opacity: 0, x: 16 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -16 } }

  return (
    <section ref={sectionRef} id="booking" className="scroll-mt-20 px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Онлайн-запис" title="Запис на сервіс" lead="Оберіть послугу та зручний час. Ми підтвердимо запис дзвінком." />

        <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-8 pb-24 lg:grid-cols-[minmax(0,1fr)_340px] lg:pb-0">
          <div data-testid="booking-card" className="min-w-0 rounded-2xl border border-line bg-panel p-5 sm:p-8">
            {done ? (
              <div ref={doneRef} tabIndex={-1} role="status" className="py-10 text-center outline-none">
                <p className="chrome-text font-heading text-xl font-semibold uppercase tracking-wider">Запит надіслано, очікуйте підтвердження</p>
                <p className="mt-3 text-sm text-muted">Ми зателефонуємо, щоб підтвердити час запису.</p>
                {calendarEvent && (
                  <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
                    <a
                      href={googleCalendarUrl(calendarEvent)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={btnGhost}
                    >
                      Додати в Google Календар
                    </a>
                    <button type="button" onClick={() => downloadIcs(calendarEvent)} className={btnGhost}>
                      Завантажити в календар (.ics)
                    </button>
                  </div>
                )}
                <button type="button" onClick={reset} className="mt-6 min-h-11 text-sm text-white/70 underline underline-offset-4">
                  Створити ще один запис
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs uppercase tracking-[0.25em] text-white/50" aria-hidden="true">
                  Крок {step + 1} з 3
                </p>
                <h3 id="booking-step-title" ref={titleRef} tabIndex={-1} className="mt-2 font-heading text-lg font-semibold uppercase tracking-wider outline-none">
                  <span className="sr-only">{`Крок ${step + 1} з 3: `}</span>
                  {TITLES[step]}
                </h3>
                <div className="mt-6 min-h-64">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div key={step} variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: reduce ? 0 : 0.18 }}>
                      {step === 0 && <StepService services={services} value={service?.id} onSelect={pickService} />}
                      {step === 1 && (
                        <StepSlot
                          days={days}
                          date={date}
                          disabledDays={disabledDays}
                          onDate={pickDate}
                          slots={slots}
                          loading={loading}
                          error={error}
                          onRetry={refetch}
                          slot={slot}
                          onSlot={(v) => { setSlot(v); setNotice(undefined) }}
                          notice={notice}
                        />
                      )}
                      {step === 2 && (
                        <StepContacts value={contacts} errors={errors} onChange={(p) => setContacts((c) => ({ ...c, ...p }))} onSubmit={submit} />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
                <p role="status" aria-live="polite" className="sr-only">{status}</p>

                <div className={`z-30 gap-3 ${inView ? 'fixed inset-x-0 bottom-0 flex' : 'max-lg:hidden'} lg:flex border-t border-line bg-bg/95 px-4 py-3 backdrop-blur lg:static lg:mt-8 lg:justify-between lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none`}>
                  {step > 0 && (
                    <button type="button" onClick={() => go(step - 1)} className={btnGhost}>
                      Назад
                    </button>
                  )}
                  {step < 2 ? (
                    <button type="button" disabled={!canNext} onClick={() => go(step + 1)} className={btnPrimary}>
                      Далі
                    </button>
                  ) : (
                    <button type="submit" form="booking-form" disabled={sending} className={btnPrimary}>
                      {sending ? 'Надсилаємо…' : 'Надіслати запит'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="hidden min-w-0 lg:block">
            <div className="sticky top-24">
              <Summary service={service} slot={slot} car={car} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
