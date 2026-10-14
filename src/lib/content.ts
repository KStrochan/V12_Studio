import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { createPublicClient } from './supabase/public'
import { FALLBACK_CONTENT, type SiteContent, type SiteSettings } from './content-fallback'
import type { DayHours, WorkingHours } from './slots'

export const SITE_CONTENT_TAG = 'site-content'

export type { SiteContent, SiteSettings, SiteService, SiteReview } from './content-fallback'

/** Public site content; falls back to placeholders when Supabase is not configured or unreachable. */
export async function getSiteContent(): Promise<SiteContent> {
  'use cache'
  cacheLife('minutes')
  cacheTag(SITE_CONTENT_TAG)

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return FALLBACK_CONTENT
  }
  try {
    const db = createPublicClient()
    const [s, sv, rv] = await Promise.all([
      db.from('settings').select('phone,address,socials,working_hours').limit(1).maybeSingle(),
      db.from('services').select('id,title,description,duration_min,icon').order('sort_order'),
      db.from('reviews').select('id,author,body,rating').order('created_at', { ascending: false }).limit(12),
    ])
    return assembleContent(s, sv, rv)
  } catch {
    return FALLBACK_CONTENT
  }
}

type Res<T> = { data: T[] | null; error: unknown }

/** Fallback only on a query error; an empty services/reviews result is real (all hidden/inactive). */
export function assembleContent(
  s: { data: SettingsRow; error: unknown },
  sv: Res<SiteContent['services'][number]>,
  rv: Res<SiteContent['reviews'][number]>,
): SiteContent {
  if (s.error || sv.error || rv.error) return FALLBACK_CONTENT
  return { settings: mergeSettings(s.data), services: sv.data ?? [], reviews: rv.data ?? [] }
}

type SettingsRow = Partial<Record<keyof SiteSettings, unknown>> | null | undefined

/** Overlays DB settings on the placeholders; null or invalid fields keep the fallback value. */
export function mergeSettings(row: SettingsRow): SiteSettings {
  const f = FALLBACK_CONTENT.settings
  if (!row) return f
  const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
  return {
    phone: typeof row.phone === 'string' && row.phone.trim() ? row.phone : f.phone,
    address: typeof row.address === 'string' && row.address.trim() ? row.address : f.address,
    socials: isObj(row.socials) ? (row.socials as Record<string, string>) : f.socials,
    working_hours:
      isObj(row.working_hours) && Object.keys(row.working_hours).length
        ? { ...f.working_hours, ...(row.working_hours as Partial<WorkingHours>) }
        : f.working_hours,
  }
}

export function phoneHref(phone: string): string {
  return 'tel:' + phone.replace(/[^\d+]/g, '')
}

/** True for the built-in placeholder (not a dialable number). */
export function isPlaceholderPhone(phone: string): boolean {
  return phone.replace(/\D/g, '').length < 12
}

/** tel: link, or null while the phone is still the placeholder. */
export function callHref(phone: string): string | null {
  return isPlaceholderPhone(phone) ? null : phoneHref(phone)
}

const DAY_NAMES = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
const ORDER = [1, 2, 3, 4, 5, 6, 0]

/** Groups consecutive days with equal hours, e.g. "Пн–Пт 09:00–18:00". */
export function formatHours(hours: WorkingHours): string[] {
  const fmt = (h: DayHours | undefined) => (h ? `${h.open}–${h.close}` : 'вихідний')
  const groups: { from: number; to: number; text: string }[] = []
  ORDER.forEach((d) => {
    const text = fmt(hours[String(d) as keyof WorkingHours])
    const last = groups[groups.length - 1]
    if (last && last.text === text) last.to = d
    else groups.push({ from: d, to: d, text })
  })
  return groups.map((g) => {
    const label = g.from === g.to ? DAY_NAMES[g.from] : `${DAY_NAMES[g.from]}–${DAY_NAMES[g.to]}`
    return `${label} ${g.text}`
  })
}
