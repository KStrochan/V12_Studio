import { normalizeUaPhone } from './phone'
import type { SiteSettings } from './content'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/**
 * Canonical origin from NEXT_PUBLIC_SITE_URL. In production a missing value yields
 * undefined (canonical-dependent fields are omitted) instead of a guessed domain;
 * dev falls back to localhost.
 */
export function resolveSiteUrl(env: { url?: string; nodeEnv?: string }): string | undefined {
  const url = env.url?.trim().replace(/\/+$/, '')
  if (url) return url
  return env.nodeEnv === 'production' ? undefined : 'http://localhost:3000'
}

export const SITE_URL = resolveSiteUrl({
  url: process.env.NEXT_PUBLIC_SITE_URL,
  nodeEnv: process.env.NODE_ENV,
})

if (!SITE_URL) {
  console.warn('NEXT_PUBLIC_SITE_URL is not set: sitemap, robots sitemap link and JSON-LD url are omitted.')
}

export function localBusinessJsonLd(settings: SiteSettings): object {
  const groups = new Map<string, string[]>()
  for (const d of [1, 2, 3, 4, 5, 6, 0]) {
    const h = settings.working_hours[String(d) as keyof SiteSettings['working_hours']]
    if (!h) continue
    const key = `${h.open}-${h.close}`
    groups.set(key, [...(groups.get(key) ?? []), DAYS[d]])
  }
  const phone = normalizeUaPhone(settings.phone)
  const hasAddress = !settings.address.includes('…') && settings.address.trim() !== ''
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    name: 'V12 Service',
    ...(SITE_URL ? { url: SITE_URL } : {}),
    ...(phone ? { telephone: phone } : {}),
    address: {
      '@type': 'PostalAddress',
      ...(hasAddress ? { streetAddress: settings.address.trim() } : {}),
      addressLocality: 'Стрий',
      addressCountry: 'UA',
    },
    openingHoursSpecification: [...groups].map(([key, dayOfWeek]) => {
      const [opens, closes] = key.split('-')
      return { '@type': 'OpeningHoursSpecification', dayOfWeek, opens, closes }
    }),
  }
}

/** Serialises JSON-LD for a <script> tag; `<` is escaped so the payload cannot close the tag. */
export function jsonLdScript(data: object): string {
  return JSON.stringify(data).split(String.fromCharCode(60)).join(String.fromCharCode(92) + 'u003c')
}
