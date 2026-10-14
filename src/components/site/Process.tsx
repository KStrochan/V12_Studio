'use client'

import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion'
import { useRef } from 'react'
import { useHeavyMotion } from '@/hooks/useHeavyMotion'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

const STEPS = [
  { t: 'Запис', d: 'Обираєте послугу й зручний час онлайн або телефонуєте нам.' },
  { t: 'Діагностика', d: 'Оглядаємо авто, знаходимо причину та узгоджуємо обсяг робіт.' },
  { t: 'Ремонт', d: 'Виконуємо роботи, фотографуємо етапи й тримаємо вас у курсі.' },
  { t: 'Видача', d: 'Показуємо результат, віддаємо старі деталі та даємо гарантію.' },
]

export function Process() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLOListElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 })
  const heavy = useHeavyMotion()
  const draw = heavy ? smooth : scrollYProgress

  return (
    <section id="process" className="scroll-mt-20 px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="Процес" title="Від запису до ключів" />
        <ol ref={ref} className="relative mt-12 space-y-10 pl-14">
          <span aria-hidden="true" className="absolute bottom-2 left-[1.4rem] top-2 w-px bg-line" />
          <motion.span
            aria-hidden="true"
            className="absolute bottom-2 left-[1.4rem] top-2 w-px origin-top bg-[image:var(--chrome)]"
            style={{ scaleY: reduce ? 1 : draw }}
          />
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.t} className="relative">
              <span className="chrome-border absolute -left-14 top-0 flex size-11 items-center justify-center rounded-full font-heading text-sm font-semibold">
                {i + 1}
              </span>
              <h3 className="font-heading text-sm font-semibold uppercase tracking-wider">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.d}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
