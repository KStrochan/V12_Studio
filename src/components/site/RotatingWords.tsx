'use client'

import { useEffect, useState } from 'react'

/** Cycles through words with a short fade/slide. Screen readers get the full list once. */
export function RotatingWords({ words, interval = 2200, className }: { words: string[]; interval?: number; className?: string }) {
  const [i, setI] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setInterval(() => setI((n) => (n + 1) % words.length), interval)
    return () => window.clearInterval(t)
  }, [words.length, interval])

  return (
    <span className={className}>
      <span className="sr-only">{words.join(', ')}</span>
      <span aria-hidden="true" className="relative inline-grid overflow-hidden align-bottom">
        {words.map((w, k) => (
          <span
            key={w}
            className="chrome-text col-start-1 row-start-1 transition-[opacity,transform] ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              opacity: k === i ? 1 : 0,
              transform: k === i ? 'translateY(0)' : k === (i - 1 + words.length) % words.length ? 'translateY(-60%)' : 'translateY(60%)',
              // The old word leaves quickly; the new one comes in once it is gone, so they never overlap.
              transitionDuration: k === i ? '550ms' : '220ms',
              transitionDelay: k === i ? '200ms' : '0ms',
            }}
          >
            {w}
          </span>
        ))}
      </span>
    </span>
  )
}
