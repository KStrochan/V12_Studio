'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Looping, muted background video for the hero (files in /public/hero, see docs/HERO-VIDEO.md).
 * Phones get a lighter vertical crop. With prefers-reduced-motion the video stays on its poster frame.
 */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => {
      if (mq.matches) {
        v.pause()
      } else {
        v.play().catch(() => {})
      }
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  return (
    <>
      <picture>
        <source media="(max-width: 767px)" srcSet="/hero/poster-mobile.webp" />
        <img src="/hero/poster.webp" alt="" fetchPriority="high" className="absolute inset-0 -z-20 h-full w-full object-cover" />
      </picture>
      <video
        ref={ref}
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        onPlaying={() => setPlaying(true)}
        className={`absolute inset-0 -z-20 h-full w-full object-cover transition-opacity duration-700 ${playing ? 'opacity-100' : 'opacity-0'}`}
      >
        <source src="/hero/hero-mobile.mp4" type="video/mp4" media="(max-width: 767px)" />
        <source src="/hero/hero-desktop.mp4" type="video/mp4" />
      </video>
    </>
  )
}
