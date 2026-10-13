'use client'

import { useEffect, useRef } from 'react'

/** Native <dialog> (focus trap, Esc, inert background); rendered only while open. */
export function AdminDialog({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
    return () => d?.close()
  }, [])
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className="m-auto w-[min(92vw,28rem)] rounded-xl border border-line bg-panel p-0 text-fg backdrop:bg-black/70"
    >
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-xl">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрити"
            className="flex size-11 items-center justify-center rounded-lg text-muted hover:text-fg"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}

export const fieldCls =
  'min-h-11 w-full rounded-lg border border-line bg-bg px-3 text-base text-fg outline-none focus:border-fg'
export const btnCls =
  'inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-4 text-sm hover:bg-panel-2 disabled:opacity-50'
export const btnPrimaryCls =
  'inline-flex min-h-11 items-center justify-center rounded-lg bg-fg px-4 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50'
