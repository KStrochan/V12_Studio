import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handleTelegramUpdate, type WebhookDeps } from '@/lib/telegram-webhook'

const ID = '123e4567-e89b-12d3-a456-426614174000'
let deps: WebhookDeps
let setStatus: ReturnType<typeof vi.fn>

const cb = (data: string, chat = 42, from = 42) => ({
  callback_query: {
    id: 'q1',
    from: { id: from },
    data,
    message: { message_id: 7, text: 'Нова заявка', chat: { id: chat } },
  },
})

beforeEach(() => {
  setStatus = vi.fn().mockResolvedValue({ result: 'updated' })
  deps = {
    secret: 's3cret',
    ownerChatId: '42',
    setBookingStatus: setStatus as never,
    answerCallbackQuery: vi.fn().mockResolvedValue(true),
    editMessageText: vi.fn().mockResolvedValue(true),
  }
})

describe('telegram webhook', () => {
  it('401 without or with wrong secret', async () => {
    expect((await handleTelegramUpdate(null, cb(`confirm:${ID}`), deps)).status).toBe(401)
    expect((await handleTelegramUpdate('nope', cb(`confirm:${ID}`), deps)).status).toBe(401)
    expect(setStatus).not.toHaveBeenCalled()
  })
  it('401 when server secret is unset', async () => {
    deps.secret = undefined
    expect((await handleTelegramUpdate('x', {}, deps)).status).toBe(401)
  })
  it('403 for foreign chat or sender', async () => {
    expect((await handleTelegramUpdate('s3cret', cb(`confirm:${ID}`, 99), deps)).status).toBe(403)
    expect((await handleTelegramUpdate('s3cret', cb(`confirm:${ID}`, 42, 99), deps)).status).toBe(403)
    expect(setStatus).not.toHaveBeenCalled()
  })
  it('confirm sets confirmed and edits message', async () => {
    const r = await handleTelegramUpdate('s3cret', cb(`confirm:${ID}`), deps)
    expect(r.status).toBe(200)
    expect(setStatus).toHaveBeenCalledWith(ID, 'confirmed')
    expect(deps.answerCallbackQuery).toHaveBeenCalledWith('q1', 'Підтверджено')
    expect(deps.editMessageText).toHaveBeenCalledWith(42, 7, 'Нова заявка\n\nСтатус: Підтверджено')
  })
  it('reject sets rejected', async () => {
    await handleTelegramUpdate('s3cret', cb(`reject:${ID}`), deps)
    expect(setStatus).toHaveBeenCalledWith(ID, 'rejected')
  })
  it('repeat press on handled booking is idempotent', async () => {
    setStatus.mockResolvedValue({ result: 'unchanged', status: 'confirmed' })
    const r = await handleTelegramUpdate('s3cret', cb(`reject:${ID}`), deps)
    expect(r.status).toBe(200)
    expect(deps.editMessageText).toHaveBeenCalledWith(42, 7, 'Нова заявка\n\nСтатус: Підтверджено')
  })
  it('ignores invalid ids and unknown updates with 200', async () => {
    expect((await handleTelegramUpdate('s3cret', cb('confirm:not-a-uuid'), deps)).status).toBe(200)
    expect((await handleTelegramUpdate('s3cret', { message: { text: 'hi' } }, deps)).status).toBe(200)
    expect((await handleTelegramUpdate('s3cret', null, deps)).status).toBe(200)
    expect(setStatus).not.toHaveBeenCalled()
  })
  it('on db error answers the callback with an error and returns 200', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    setStatus.mockRejectedValue(new Error('db down'))
    const r = await handleTelegramUpdate('s3cret', cb(`confirm:${ID}`), deps)
    expect(r.status).toBe(200)
    expect(deps.answerCallbackQuery).toHaveBeenCalledWith('q1', 'Помилка, спробуйте ще раз')
    expect(deps.editMessageText).not.toHaveBeenCalled()
  })
  it('POST route: 401 on bad secret even without supabase env', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    process.env.TELEGRAM_WEBHOOK_SECRET = 's3cret'
    vi.doMock('server-only', () => ({}))
    const { POST } = await import('./route')
    const res = await POST(new Request('http://x/api/telegram/webhook', { method: 'POST', body: '{}' }))
    expect(res.status).toBe(401)
  })
  it('200 when booking not found', async () => {
    setStatus.mockResolvedValue({ result: 'not_found' })
    expect((await handleTelegramUpdate('s3cret', cb(`confirm:${ID}`), deps)).status).toBe(200)
    expect(deps.editMessageText).not.toHaveBeenCalled()
  })
})
