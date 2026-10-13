'use client'

import { animate, useInView, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useHeavyMotion } from '@/hooks/useHeavyMotion'

type Props = { to: number; suffix?: string; className?: string }

/**
 * Server-renders the final value. On heavy-motion devices the count restarts from 0 only while the
 * element is still below the fold, then runs when it scrolls into view. Others keep the final value.
 */
export function CountUp({ to, suffix = '', className }: Props) {
  const reduce = useReducedMotion()
  const heavy = useHeavyMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const [value, setValue] = useState(to)
  const animated = heavy && !reduce

  useEffect(() => {
    if (!animated || inView || !ref.current) return
    if (ref.current.getBoundingClientRect().top > window.innerHeight) setValue(0)
  }, [animated, inView])

  useEffect(() => {
    if (!animated || !inView) return
    const controls = animate(0, to, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    })
    return () => controls.stop()
  }, [animated, inView, to])

  return (
    <span ref={ref} className={className}>
      {value}
      {suffix}
    </span>
  )
}
