'use client'

import { useRef, type ReactNode } from 'react'
import { useHeavyMotion } from '@/hooks/useHeavyMotion'
import { cn } from '@/lib/cn'

type Props = {
  href: string
  children: ReactNode
  variant?: 'primary' | 'ghost'
  className?: string
  /** Pull the button toward the cursor; only active on heavy-motion devices. */
  magnetic?: boolean
}

const base =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 text-sm font-semibold tracking-wide transition-[transform,box-shadow,background-color,border-color] duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white'

export function CtaLink({ href, children, variant = 'primary', className, magnetic = false }: Props) {
  const heavy = useHeavyMotion()
  const ref = useRef<HTMLAnchorElement>(null)

  function move(e: React.PointerEvent<HTMLAnchorElement>) {
    if (!magnetic || !heavy || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const dx = (e.clientX - (r.left + r.width / 2)) * 0.25
    const dy = (e.clientY - (r.top + r.height / 2)) * 0.3
    ref.current.style.transition = 'none'
    ref.current.style.transform = `translate(${dx}px, ${dy}px)`
  }
  function leave() {
    if (!ref.current) return
    ref.current.style.transition = ''
    ref.current.style.transform = ''
  }

  return (
    <a
      ref={ref}
      href={href}
      onPointerMove={move}
      onPointerLeave={leave}
      className={cn(
        base,
        variant === 'primary'
          ? 'bg-[image:var(--chrome)] text-black shadow-[0_0_0_1px_rgba(255,255,255,0.25)_inset,0_10px_40px_-10px_rgba(220,224,232,0.45)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.4)_inset,0_14px_50px_-8px_rgba(220,224,232,0.65)]'
          : 'chrome-border text-fg hover:bg-panel-2',
        className,
      )}
    >
      {children}
    </a>
  )
}
