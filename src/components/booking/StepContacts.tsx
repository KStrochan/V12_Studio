'use client'

import type { FormEvent, InputHTMLAttributes } from 'react'

export type Contacts = { name: string; phone: string; carMake: string; carModel: string; comment: string }
export type ContactErrors = Partial<Record<keyof Contacts | '_', string>>

const field =
  'mt-2 block min-h-12 w-full rounded-xl border border-line bg-bg px-4 text-base text-fg placeholder:text-white/30 focus:border-white/60 focus:outline-none aria-[invalid=true]:border-red-400'

type Props = {
  value: Contacts
  errors: ContactErrors
  onChange: (patch: Partial<Contacts>) => void
  onSubmit: () => void
}

export function StepContacts({ value, errors, onChange, onSubmit }: Props) {
  const err = (k: keyof Contacts) => (errors[k] ? `booking-${k}-err` : undefined)
  const input = (k: keyof Contacts, label: string, extra: InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`booking-${k}`} className="text-sm text-white/80">{label}</label>
      <input
        id={`booking-${k}`}
        name={k}
        value={value[k]}
        onChange={(e) => onChange({ [k]: e.target.value })}
        className={field}
        aria-invalid={!!errors[k]}
        aria-describedby={err(k)}
        {...extra}
      />
      {errors[k] && <p id={`booking-${k}-err`} role="alert" className="mt-1.5 text-sm text-red-400">{errors[k]}</p>}
    </div>
  )

  return (
    <form
      id="booking-form"
      noValidate
      aria-labelledby="booking-step-title"
      onSubmit={(e: FormEvent) => {
        e.preventDefault()
        onSubmit()
      }}
      className="relative space-y-5"
    >
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true" inert>
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {input('name', "Ім'я", { autoComplete: 'name', required: true })}
      {input('phone', 'Телефон', { type: 'tel', inputMode: 'tel', autoComplete: 'tel', placeholder: '+380 __ ___ __ __', required: true })}
      <div className="grid gap-5 sm:grid-cols-2">
        {input('carMake', 'Марка авто', { placeholder: 'Напр. BMW', required: true })}
        {input('carModel', 'Модель', { placeholder: 'Напр. X5', required: true })}
      </div>
      <div>
        <label htmlFor="booking-comment" className="text-sm text-white/80">Коментар (необов&apos;язково)</label>
        <textarea
          id="booking-comment"
          name="comment"
          rows={3}
          maxLength={500}
          value={value.comment}
          onChange={(e) => onChange({ comment: e.target.value })}
          className={`${field} py-3`}
          aria-invalid={!!errors.comment}
          aria-describedby={err('comment')}
        />
        {errors.comment && <p id="booking-comment-err" role="alert" className="mt-1.5 text-sm text-red-400">{errors.comment}</p>}
      </div>
      {errors._ && <p id="booking-general-err" tabIndex={-1} role="alert" className="text-sm text-red-400 outline-none">{errors._}</p>}
    </form>
  )
}
