import type { ContactErrors, Contacts } from './StepContacts'

const FIELD_KEYS = ['name', 'phone', 'carMake', 'carModel', 'comment']

/** Keeps field errors and turns errors for keys the form doesn't render into a visible general message. */
export function normalizeServerErrors(raw: unknown): ContactErrors {
  const generic = 'Не вдалося надіслати запит. Перевірте дані й спробуйте ще раз.'
  if (!raw || typeof raw !== 'object') return { _: generic }
  const out: ContactErrors = {}
  const unknown: string[] = []
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const msg = typeof v === 'string' ? v : Array.isArray(v) && typeof v[0] === 'string' ? v[0] : undefined
    if (FIELD_KEYS.includes(k) && msg) out[k as keyof Contacts] = msg
    else if (k === '_' && msg) out._ = msg
    else if (msg) unknown.push(msg)
  }
  if (!out._ && (unknown.length || Object.keys(out).length === 0)) out._ = unknown[0] ?? generic
  return out
}
