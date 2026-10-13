import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildOwnerMessage, notifyOwner } from './telegram'

beforeEach(() => {
  process.env.TELEGRAM_BOT_TOKEN = 'tok'
  process.env.TELEGRAM_OWNER_CHAT_ID = '42'
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

describe('notifyOwner', () => {
  it('does not throw on HTTP 500', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('x', { status: 500 })))
    await expect(notifyOwner({ text: 'hi' })).resolves.toBeUndefined()
  })
  it('does not throw on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')))
    await expect(notifyOwner({ text: 'hi' })).resolves.toBeUndefined()
  })
  it('does not throw when env is missing', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN
    const f = vi.fn()
    vi.stubGlobal('fetch', f)
    await expect(notifyOwner({ text: 'hi' })).resolves.toBeUndefined()
    expect(f).not.toHaveBeenCalled()
  })
  it('passes an abort signal and swallows a timeout without logging the token', async () => {
    const f = vi.fn().mockRejectedValue(new DOMException('timed out', 'TimeoutError'))
    vi.stubGlobal('fetch', f)
    await expect(notifyOwner({ text: 'hi' })).resolves.toBeUndefined()
    expect(f.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal)
    const logged = JSON.stringify((console.error as unknown as { mock: { calls: unknown[] } }).mock.calls)
    expect(logged).not.toContain('tok')
  })
  it('sends text and inline buttons', async () => {
    const f = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', f)
    await notifyOwner({ text: 'hi', buttons: [{ text: 'A', data: 'confirm:1' }] })
    const [url, init] = f.mock.calls[0]
    expect(url).toBe('https://api.telegram.org/bottok/sendMessage')
    const body = JSON.parse(init.body)
    expect(body.chat_id).toBe('42')
    expect(body.reply_markup.inline_keyboard[0][0]).toEqual({ text: 'A', callback_data: 'confirm:1' })
  })
})

describe('buildOwnerMessage', () => {
  it('formats booking with Kyiv time and buttons', () => {
    const m = buildOwnerMessage(
      {
        type: 'booking',
        id: 'abc',
        booking: {
          serviceId: 's',
          start: '2026-07-01T07:00:00.000Z',
          end: '2026-07-01T08:00:00.000Z',
          postNo: 1,
          name: 'Іван',
          phone: '+380501234567',
          carMake: 'BMW',
          carModel: 'X5',
          comment: null,
        },
      },
      'Діагностика',
    )
    expect(m.text).toContain('Діагностика')
    expect(m.text).toContain('10:00')
    expect(m.text).toContain('Іван')
    expect(m.text).toContain('+380501234567')
    expect(m.text).toContain('BMW X5')
    expect(m.buttons?.map((b) => b.data)).toEqual(['confirm:abc', 'reject:abc'])
  })
  it('formats consultation without buttons', () => {
    const m = buildOwnerMessage(
      { type: 'consultation', id: 'c', consultation: { name: 'Оля', phone: '+380671112233', question: 'Q?' } },
      '',
    )
    expect(m.text).toContain('Оля')
    expect(m.buttons).toBeUndefined()
  })
})
