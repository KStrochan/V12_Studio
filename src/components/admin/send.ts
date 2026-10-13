/** Client-side JSON call to /api/admin/*; returns a Ukrainian error message on failure. */
export async function sendJson(
  url: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const data: unknown = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = (data as { error?: string }).error
      return { ok: false, error: msg ?? 'Не вдалося зберегти' }
    }
    return { ok: true, data }
  } catch {
    return { ok: false, error: 'Немає зв’язку із сервером' }
  }
}

export const alertCls = 'rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300'
