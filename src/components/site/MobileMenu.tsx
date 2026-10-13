'use client'

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'
import { NAV } from './nav'

const noopSubscribe = () => () => {}

type Props = { phone: string; phoneHref: string | null }

export function MobileMenu({ phone, phoneHref }: Props) {
  const [open, setOpen] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLElement>(null)
  const panelId = useId()
  // The overlay is portalled to <body>: the header's backdrop-filter would otherwise become
  // the containing block of its fixed-position descendants and clip the panel.
  const canPortal = useSyncExternalStore(noopSubscribe, () => true, () => false)

  const close = useCallback(() => {
    setOpen(false)
    // after the click default action (hash navigation) so it cannot steal focus back
    setTimeout(() => toggle.current?.focus(), 0)
  }, [])

  useEffect(() => {
    if (!open) return
    const focusables = () =>
      Array.from(panel.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [])
    focusables()[0]?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || !panel.current?.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !panel.current?.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, close])

  const overlay = (
    <div className="lg:hidden">
      <div
        aria-hidden="true"
        onClick={close}
        className={cn(
          'fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <nav
        ref={panel}
        id={panelId}
        aria-label="Мобільне меню"
        inert={!open}
        className={cn(
          'fixed inset-y-0 right-0 z-[55] flex w-[min(86vw,22rem)] flex-col gap-2 border-l border-line bg-bg px-6 pb-8 pt-24 transition-transform duration-300 ease-out motion-reduce:transition-none',
          open ? 'translate-x-0' : 'invisible translate-x-full',
        )}
      >
        <button
          type="button"
          aria-label="Закрити меню"
          onClick={close}
          className="absolute right-4 top-3 flex size-11 items-center justify-center rounded-full border border-line bg-panel"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        {NAV.map((l) => (
          <a
            key={l.href}
            href={l.href}
            onClick={close}
            className="flex min-h-12 items-center border-b border-line font-heading text-sm uppercase tracking-[0.18em] text-white/90"
          >
            {l.label}
          </a>
        ))}
        <a
          href="#booking"
          onClick={close}
          className="mt-6 flex min-h-12 items-center justify-center rounded-full bg-[image:var(--chrome)] text-sm font-semibold text-black"
        >
          Записатися
        </a>
        {phoneHref && (
          <a href={phoneHref} className="mt-2 flex min-h-12 items-center justify-center text-sm text-white/70">
            {phone}
          </a>
        )}
      </nav>
    </div>
  )

  return (
    <div className="lg:hidden">
      <button
        ref={toggle}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? 'Закрити меню' : 'Відкрити меню'}
        onClick={() => setOpen((v) => !v)}
        className="flex size-11 items-center justify-center rounded-full border border-line bg-panel/80 backdrop-blur"
      >
        <span aria-hidden="true" className="relative block h-3.5 w-5">
          <span className="absolute left-0 top-0 h-0.5 w-5 rounded bg-white" />
          <span className="absolute left-0 top-1.5 h-0.5 w-5 rounded bg-white" />
          <span className="absolute left-0 top-3 h-0.5 w-5 rounded bg-white" />
        </span>
      </button>
      {canPortal && createPortal(overlay, document.body)}
    </div>
  )
}
