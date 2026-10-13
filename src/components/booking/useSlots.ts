'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type Slot = { start: string; postNo: number }

export type SlotsResult = { slots: Slot[]; error?: string }

export function slotsErrorMessage(status: number): string {
  if (status === 429) return 'Забагато запитів. Зачекайте хвилину й спробуйте ще раз.'
  if (status === 422) return 'Цю дату обрати неможливо. Оберіть іншу.'
  return 'Не вдалося завантажити вільний час. Спробуйте ще раз.'
}

/** Fetches free slots; resolves with an error message instead of throwing (except abort). */
export async function fetchSlots(serviceId: string, date: string, signal?: AbortSignal): Promise<SlotsResult> {
  try {
    const res = await fetch(`/api/slots?serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(date)}`, { signal })
    if (!res.ok) return { slots: [], error: slotsErrorMessage(res.status) }
    const data = (await res.json()) as { slots?: Slot[] }
    return { slots: Array.isArray(data.slots) ? data.slots : [] }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    return { slots: [], error: 'Немає зʼєднання. Перевірте інтернет і спробуйте ще раз.' }
  }
}

/** Guards against out-of-order responses: only the latest issued ticket is current. */
export function createLatestGuard() {
  let n = 0
  return {
    next: () => ++n,
    isCurrent: (ticket: number) => ticket === n,
  }
}

export function useSlots(serviceId: string | undefined, date: string | undefined) {
  const [state, setState] = useState<{ key: string; slots: Slot[]; error?: string } | null>(null)
  const [tick, setTick] = useState(0)
  const guard = useRef(createLatestGuard())
  const key = serviceId && date ? `${serviceId}|${date}|${tick}` : ''

  useEffect(() => {
    if (!serviceId || !date) return
    const ticket = guard.current.next()
    const ac = new AbortController()
    fetchSlots(serviceId, date, ac.signal)
      .then((r) => {
        if (guard.current.isCurrent(ticket)) setState({ key, slots: r.slots, error: r.error })
      })
      .catch(() => {})
    return () => ac.abort()
  }, [serviceId, date, key])

  const refetch = useCallback(() => setTick((t) => t + 1), [])
  const replace = useCallback((slots: Slot[]) => setState((s) => (s ? { ...s, slots, error: undefined } : s)), [])

  const current = key && state?.key === key ? state : null
  return {
    slots: current?.slots ?? [],
    loading: !!key && !current,
    error: current?.error,
    refetch,
    /** Replace the list (used with the fresh slots from a 409 response). */
    replace,
  }
}
