import { timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { telegramCall } from './telegram'

export type BookingStatus = 'confirmed' | 'rejected'
export type SetStatusResult =
  | { result: 'updated' }
  | { result: 'unchanged'; status: string }
  | { result: 'not_found' }

export type WebhookDeps = {
  secret: string | undefined
  ownerChatId: string | undefined
  /** Must only move pending -> target (atomic compare-and-set). */
  setBookingStatus(id: string, target: BookingStatus): Promise<SetStatusResult>
  answerCallbackQuery(id: string, text: string): Promise<unknown>
  editMessageText(chatId: number | string, messageId: number, text: string): Promise<unknown>
}

export type HttpResult = { status: number; body: unknown }

const LABEL: Record<string, string> = {
  confirmed: 'Підтверджено',
  rejected: 'Відхилено',
  done: 'Виконано',
  cancelled: 'Скасовано',
  pending: 'Очікує',
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

const callbackSchema = z.object({
  id: z.string(),
  from: z.object({ id: z.number() }).optional(),
  message: z
    .object({
      message_id: z.number(),
      text: z.string().optional(),
      chat: z.object({ id: z.number() }),
    })
    .optional(),
  data: z.string().optional(),
})

const DATA = /^(confirm|reject):([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i

export async function handleTelegramUpdate(
  headerSecret: string | null,
  update: unknown,
  deps: WebhookDeps,
): Promise<HttpResult> {
  if (!deps.secret || !headerSecret || !safeEqual(headerSecret, deps.secret)) {
    return { status: 401, body: { error: 'unauthorized' } }
  }
  const ok = { status: 200, body: { ok: true } }
  const cbRaw = (update as { callback_query?: unknown } | null)?.callback_query
  if (!cbRaw) return ok
  const parsed = callbackSchema.safeParse(cbRaw)
  if (!parsed.success) return ok
  const cb = parsed.data

  const owner = deps.ownerChatId
  const chatOk = cb.message && owner && safeEqual(String(cb.message.chat.id), owner)
  const fromOk = cb.from && owner && safeEqual(String(cb.from.id), owner)
  if (!chatOk || !fromOk) return { status: 403, body: { error: 'forbidden' } }

  const m = cb.data ? DATA.exec(cb.data) : null
  if (!m) {
    await deps.answerCallbackQuery(cb.id, 'Невідома дія')
    return ok
  }
  const target: BookingStatus = m[1] === 'confirm' ? 'confirmed' : 'rejected'
  try {
    const r = await deps.setBookingStatus(m[2], target)
    if (r.result === 'not_found') {
      await deps.answerCallbackQuery(cb.id, 'Запис не знайдено')
      return ok
    }
    const status = r.result === 'updated' ? target : r.status
    const label = LABEL[status] ?? status
    await deps.answerCallbackQuery(cb.id, r.result === 'updated' ? label : `Вже оброблено: ${label}`)
    const base = (cb.message?.text ?? '').split('\n\nСтатус:')[0]
    await deps.editMessageText(cb.message!.chat.id, cb.message!.message_id, `${base}\n\nСтатус: ${label}`)
  } catch (e) {
    console.error('telegram webhook error', e instanceof Error ? e.message : 'unknown')
    try {
      await deps.answerCallbackQuery(cb.id, 'Помилка, спробуйте ще раз')
    } catch {
      // best effort
    }
  }
  return ok
}

/** Default Bot API-backed callbacks (never throw). */
export const botApi = {
  answerCallbackQuery: (id: string, text: string) =>
    telegramCall('answerCallbackQuery', { callback_query_id: id, text }),
  editMessageText: (chatId: number | string, messageId: number, text: string) =>
    telegramCall('editMessageText', { chat_id: chatId, message_id: messageId, text }),
}
