'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { btnPrimaryCls, fieldCls } from '@/components/admin/AdminDialog'
import { alertCls, sendJson } from '@/components/admin/send'

export function ClientNotes({ id, initial }: { id: string; initial: string }) {
  const router = useRouter()
  const [notes, setNotes] = useState(initial)
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState('')

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setState('saving')
    const r = await sendJson(`/api/admin/clients/${id}`, 'PATCH', { notes })
    if (!r.ok) {
      setError(r.error)
      setState('idle')
      return
    }
    setState('saved')
    router.refresh()
  }

  return (
    <form onSubmit={save} className="space-y-2">
      <label htmlFor="client-notes" className="block text-sm text-muted">
        Нотатки власника
      </label>
      <textarea
        id="client-notes"
        value={notes}
        maxLength={2000}
        rows={5}
        onChange={(e) => {
          setNotes(e.target.value)
          setState('idle')
        }}
        className={`${fieldCls} py-2`}
      />
      {error ? <p role="alert" className={alertCls}>{error}</p> : null}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={state === 'saving'} className={btnPrimaryCls}>
          Зберегти
        </button>
        {state === 'saved' ? <p role="status" className="text-sm text-muted">Збережено</p> : null}
      </div>
    </form>
  )
}
