import 'server-only'
import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { SITE_CONTENT_TAG } from './content'
import type { z } from 'zod'
import { firstError, uuidSchema } from './admin-schemas'

export const fail = (error: string, status = 422) => NextResponse.json({ error }, { status })
export const serverError = (where: string, e: unknown) => {
  console.error(where, e)
  return fail('Сервіс тимчасово недоступний', 500)
}

/** Parses the JSON body against a zod schema; returns either the data or a ready 422 response. */
export async function parseBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<{ ok: true; data: z.output<T> } | { ok: false; response: NextResponse }> {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return { ok: false, response: fail('Невірний запит') }
  }
  const r = schema.safeParse(json)
  if (!r.success) return { ok: false, response: fail(firstError(r.error)) }
  return { ok: true, data: r.data }
}

export function parseId(id: string): { ok: true; id: string } | { ok: false; response: NextResponse } {
  const r = uuidSchema.safeParse(id)
  return r.success ? { ok: true, id: r.data } : { ok: false, response: fail('Невірний ідентифікатор') }
}

/** Public-site content (services, settings, reviews) changed: expire the 'use cache' entry now. */
export function refreshSiteContent() {
  try {
    revalidateTag(SITE_CONTENT_TAG, { expire: 0 })
  } catch (e) {
    // The write already succeeded; a cache error must not turn it into a 500.
    console.error("revalidateTag failed", e)
  }
}
