export function normalizeUaPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  let national: string
  if (digits.length === 12 && digits.startsWith('380')) national = digits.slice(3)
  else if (digits.length === 10 && digits.startsWith('0')) national = digits.slice(1)
  else return null
  return /^\d{9}$/.test(national) ? `+380${national}` : null
}
