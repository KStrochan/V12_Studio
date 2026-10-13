import { botApi, handleTelegramUpdate } from '@/lib/telegram-webhook'
import { createAdminClient, setBookingStatusDb } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  let update: unknown = null
  try {
    update = await request.json()
  } catch {
    // malformed body: still authenticate first, then ignore
  }
  try {
    const r = await handleTelegramUpdate(request.headers.get('x-telegram-bot-api-secret-token'), update, {
      secret: process.env.TELEGRAM_WEBHOOK_SECRET,
      ownerChatId: process.env.TELEGRAM_OWNER_CHAT_ID,
      setBookingStatus: (id, target) => setBookingStatusDb(createAdminClient(), id, target),
      ...botApi,
    })
    return Response.json(r.body, { status: r.status })
  } catch (e) {
    // 200 so Telegram does not retry endlessly; the error is logged.
    console.error('POST /api/telegram/webhook', e)
    return Response.json({ ok: false }, { status: 200 })
  }
}
