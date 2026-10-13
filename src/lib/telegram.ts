import { BUSINESS_TZ } from './slots'
import type { NotifyEvent } from './booking-service'

export type OwnerMessage = { text: string; buttons?: { text: string; data: string }[] }

const API = 'https://api.telegram.org'

/** Calls a Bot API method. Never throws; returns true on a 2xx response. */
export async function telegramCall(method: string, body: unknown): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.error(`telegram ${method}: TELEGRAM_BOT_TOKEN is not set`)
    return false
  }
  try {
    const res = await fetch(`${API}/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) {
      console.error(`telegram ${method} failed: HTTP ${res.status}`)
      return false
    }
    return true
  } catch (e) {
    console.error(`telegram ${method} error`, e instanceof Error ? e.message : 'unknown')
    return false
  }
}

/** Sends a message to the owner chat. Never throws; failures are only logged. */
export async function notifyOwner(msg: OwnerMessage): Promise<void> {
  try {
    const chatId = process.env.TELEGRAM_OWNER_CHAT_ID
    if (!chatId) {
      console.error('notifyOwner: TELEGRAM_OWNER_CHAT_ID is not set')
      return
    }
    await telegramCall('sendMessage', {
      chat_id: chatId,
      text: msg.text,
      ...(msg.buttons?.length
        ? {
            reply_markup: {
              inline_keyboard: [msg.buttons.map((b) => ({ text: b.text, callback_data: b.data }))],
            },
          }
        : {}),
    })
  } catch (e) {
    console.error('notifyOwner error', e)
  }
}

export function formatKyiv(iso: string): string {
  return new Intl.DateTimeFormat('uk-UA', {
    timeZone: BUSINESS_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

/** Builds the owner message for a new booking / consultation. */
export function buildOwnerMessage(event: NotifyEvent, serviceName: string): OwnerMessage {
  if (event.type === 'booking') {
    const b = event.booking
    const lines = [
      'Нова заявка на запис',
      `Послуга: ${serviceName}`,
      `Дата і час: ${formatKyiv(b.start)} (Київ)`,
      `Ім'я: ${b.name}`,
      `Телефон: ${b.phone}`,
      `Авто: ${b.carMake} ${b.carModel}`,
    ]
    if (b.comment) lines.push(`Коментар: ${b.comment}`)
    return {
      text: lines.join('\n'),
      buttons: [
        { text: 'Підтвердити', data: `confirm:${event.id}` },
        { text: 'Відхилити', data: `reject:${event.id}` },
      ],
    }
  }
  const c = event.consultation
  const lines = ['Нова заявка на консультацію', `Ім'я: ${c.name}`, `Телефон: ${c.phone}`]
  if (c.question) lines.push(`Питання: ${c.question}`)
  return { text: lines.join('\n') }
}
