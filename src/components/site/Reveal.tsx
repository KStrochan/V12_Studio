'use client'

import { createElement, useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
  delay?: number
  /** Pixels to travel upward while fading in. */
  y?: number
  as?: 'div' | 'section' | 'li' | 'p' | 'span'
  /**
   * "scroll" (default): content is server-rendered visible; after hydration, elements below the
   * fold are hidden and revealed when scrolled into view.
   * "load": pure-CSS entrance animation on first paint (for above-the-fold content).
   */
  mode?: 'scroll' | 'load'
}

/**
 * Entrance animation that never hides content in server HTML: without JS (or with
 * prefers-reduced-motion, via the CSS override in globals.css) everything stays visible.
 */
export function Reveal({ children, className, delay = 0, y = 24, as = 'div', mode = 'scroll' }: Props) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (mode !== 'scroll' || !el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return
    el.dataset.reveal = 'hidden'
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        el.dataset.reveal = 'shown'
        io.disconnect()
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      delete el.dataset.reveal
    }
  }, [mode])

  const style = { '--reveal-y': `${y}px`, '--reveal-delay': `${delay}s` } as CSSProperties
  return createElement(
    as,
    { ref, className: mode === 'load' ? `${className ?? ''} reveal-load` : className, style },
    children,
  )
}
