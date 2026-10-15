/** Business location and Google Maps data. Pure constants and helpers, safe for client use. */

export const BUSINESS_LOCATION = {
  lat: 49.2666809,
  lng: 23.8763218,
  address: 'вулиця Клима Савури, 2б, Стрий, Львівська область, 82404',
  plusCode: '7V8G+MG',
} as const

/**
 * Google Maps listing data. `rating` and `reviewCount` are updated MANUALLY
 * (no API key is used); bump `lastCheckedISO` whenever they are re-checked.
 */
export const GOOGLE_PLACE = {
  rating: 4.3,
  reviewCount: 70,
  cidHex: '0x11802dd0c00439a6',
  lastCheckedISO: '2026-10-15',
} as const

/** Converts a hex CID (with or without 0x) to its decimal string. */
export function cidToDecimal(hex: string): string {
  const h = hex.trim().replace(/^0x/i, '')
  return BigInt('0x' + h).toString(10)
}

export function googleEmbedUrl(): string {
  const { lat, lng } = BUSINESS_LOCATION
  return `https://www.google.com/maps?q=${lat},${lng}&z=17&output=embed`
}

export function googleDirectionsUrl(): string {
  const { lat, lng } = BUSINESS_LOCATION
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

export function googlePlaceUrl(): string {
  return `https://www.google.com/maps?cid=${cidToDecimal(GOOGLE_PLACE.cidHex)}`
}
