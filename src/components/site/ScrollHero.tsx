'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChromeText } from './ChromeText'
import { CtaLink } from './CtaLink'
import {
  beatOpacity,
  coverRect,
  frameAt,
  frameSrc,
  loadOrder,
  nearestLoaded,
  sectionProgress,
  type HeroSequence,
  type SequenceSet,
} from './scrollSequence'

type Fact = { k: string; v: string }

/** Captions shown over the video, each during its own slice of the scroll. */
const BEATS: { start: number; end: number; align: 'left' | 'right' | 'center'; node: ReactNode }[] = [
  {
    start: 0.32,
    end: 0.5,
    align: 'right',
    node: (
      <p className="font-heading text-[clamp(2.4rem,8vw,6.5rem)] font-semibold uppercase leading-none tracking-[0.04em]">
        <ChromeText>Діагностика.</ChromeText>
      </p>
    ),
  },
  {
    start: 0.5,
    end: 0.66,
    align: 'left',
    node: (
      <p className="font-heading text-[clamp(2.4rem,8vw,6.5rem)] font-semibold uppercase leading-none tracking-[0.04em]">
        Ходова.
        <br />
        <ChromeText>Двигун.</ChromeText>
      </p>
    ),
  },
  {
    start: 0.66,
    end: 0.8,
    align: 'right',
    node: (
      <p className="font-heading text-[clamp(2.4rem,8vw,6.5rem)] font-semibold uppercase leading-none tracking-[0.04em]">
        Електрика.
        <br />
        <ChromeText>Кузов.</ChromeText>
      </p>
    ),
  },
]

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

export function ScrollHero({ sequence, facts }: { sequence: HeroSequence; facts: Fact[] }) {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const introRef = useRef<HTMLDivElement>(null)
  const outroRef = useRef<HTMLDivElement>(null)
  const beatRefs = useRef<(HTMLDivElement | null)[]>([])
  const barRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return
    const section = sectionRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!section || !canvas || !ctx) return

    const phone = window.matchMedia('(max-width: 767px)').matches
    const set: SequenceSet = (phone && sequence.mobile) || sequence.desktop
    const frames: HTMLImageElement[] = new Array(set.count)
    const loaded = new Array<boolean>(set.count).fill(false)
    let current = -1
    let raf = 0
    let alive = true

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(canvas.clientWidth * dpr)
      canvas.height = Math.round(canvas.clientHeight * dpr)
      current = -1
    }

    const draw = (target: number) => {
      const i = nearestLoaded(target, loaded)
      if (i < 0 || i === current) return
      const img = frames[i]
      const r = coverRect(img.naturalWidth, img.naturalHeight, canvas.width, canvas.height)
      ctx.drawImage(img, r.x, r.y, r.w, r.h)
      current = i
    }

    const update = () => {
      raf = 0
      const rect = section.getBoundingClientRect()
      const p = sectionProgress(rect.top, rect.height, window.innerHeight)
      draw(frameAt(p, set.count))
      if (introRef.current) {
        const o = beatOpacity(p, 0, 0.22)
        introRef.current.style.opacity = String(o)
        introRef.current.style.transform = `translateY(${(1 - o) * -24}px)`
      }
      beatRefs.current.forEach((el, k) => {
        if (!el) return
        const o = beatOpacity(p, BEATS[k].start, BEATS[k].end)
        el.style.opacity = String(o)
        el.style.transform = `translateY(${(1 - o) * 30}px)`
      })
      if (outroRef.current) {
        const o = beatOpacity(p, 0.86, 1)
        outroRef.current.style.opacity = String(o)
        outroRef.current.style.transform = `translateY(${(1 - o) * 30}px)`
        outroRef.current.style.pointerEvents = o > 0.5 ? 'auto' : 'none'
      }
      if (barRef.current) barRef.current.style.transform = `scaleY(${p})`
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    // Fetch frames coarse-to-fine, a few at a time, so scrolling works long before everything is in.
    const order = loadOrder(set.count)
    let next = 0
    const pump = () => {
      if (!alive || next >= order.length) return
      const i = order[next++]
      const img = new Image()
      img.decoding = 'async'
      img.src = frameSrc(set, i)
      frames[i] = img
      img
        .decode()
        .then(() => {
          if (!alive) return
          loaded[i] = true
          if (i === 0) {
            setReady(true)
            schedule()
          } else if (Math.abs(i - frameAt(sectionProgress(section.getBoundingClientRect().top, section.offsetHeight, window.innerHeight), set.count)) < 6) {
            current = -1
            schedule()
          }
        })
        .catch(() => {})
        .finally(pump)
    }
    for (let k = 0; k < 6; k++) pump()

    size()
    schedule()
    const onResize = () => {
      size()
      schedule()
    }
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      alive = false
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', onResize)
    }
  }, [sequence, reduced])

  const intro = (
    <>
      <p className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/70">
        <span className="h-px w-8 bg-[image:var(--chrome)]" />
        Автосервіс · Стрий
      </p>
      <h1 className="mt-6 font-heading text-[clamp(1.9rem,9.6vw,5.5rem)] font-semibold uppercase leading-[1.05] tracking-[0.04em]">
        Точний ремонт.
        <br />
        <ChromeText>Характер V12.</ChromeText>
      </h1>
      <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">Діагностика, ходова, двигун, електрика та кузов.</p>
    </>
  )

  const outro = (
    <>
      <p className="font-heading text-[clamp(1.8rem,6vw,4.2rem)] font-semibold uppercase leading-[1.05] tracking-[0.04em]">
        Онлайн-запис
        <br />
        <ChromeText>за 1 хвилину.</ChromeText>
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <CtaLink href="#booking" magnetic>
          Записатися
        </CtaLink>
        <CtaLink href="#consultation" variant="ghost" magnetic>
          Консультація
        </CtaLink>
      </div>
      <dl className="mt-10 grid max-w-xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line">
        {facts.map((f) => (
          <div key={f.k} className="bg-panel/90 px-3 py-4 sm:px-5">
            <dt className="chrome-text font-heading text-[0.7rem] font-semibold uppercase tracking-wider sm:text-xs">{f.k}</dt>
            <dd className="mt-1 text-xs text-muted sm:text-sm">{f.v}</dd>
          </div>
        ))}
      </dl>
    </>
  )

  // Reduced motion: one still frame with the full hero text, no scroll-jacking of any kind.
  if (reduced) {
    return (
      <section id="top" className="relative isolate flex min-h-svh items-end overflow-hidden px-4 pb-20 pt-28 sm:px-6">
        {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized video still */}
        <img src={sequence.poster} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(10,10,11,0.55),rgba(10,10,11,0.75)_60%,#0a0a0b)]" />
        <div className="mx-auto w-full max-w-6xl">
          {intro}
          <div className="mt-10">{outro}</div>
        </div>
      </section>
    )
  }

  return (
    <section id="top" ref={sectionRef} className="relative h-[360svh] lg:h-[420svh]" aria-label="Автосервіс V12">
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* Still frame until the canvas has the first frame decoded (also what crawlers and no-JS see). */}
        {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized video still */}
        <img
          src={sequence.poster}
          alt=""
          fetchPriority="high"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${ready ? 'opacity-0' : 'opacity-100'}`}
        />
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(10,10,11,0.55)_0%,rgba(10,10,11,0.1)_30%,rgba(10,10,11,0.15)_60%,rgba(10,10,11,0.85)_100%)]" />

        <div className="relative mx-auto flex h-full max-w-6xl flex-col px-4 sm:px-6">
          <div ref={introRef} className="pt-28 lg:pt-40">
            {intro}
            <p className="mt-10 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/60">
              <span className="inline-block h-8 w-px animate-pulse bg-white/60" />
              Гортайте
            </p>
          </div>

          {BEATS.map((b, k) => (
            <div
              key={k}
              ref={(el) => {
                beatRefs.current[k] = el
              }}
              aria-hidden="true"
              style={{ opacity: 0 }}
              className={`pointer-events-none absolute inset-x-4 bottom-[14svh] sm:inset-x-6 ${
                b.align === 'right' ? 'text-right' : b.align === 'center' ? 'text-center' : 'text-left'
              }`}
            >
              {b.node}
            </div>
          ))}

          <div ref={outroRef} style={{ opacity: 0, pointerEvents: 'none' }} className="absolute inset-x-4 bottom-[10svh] sm:inset-x-6">
            {outro}
          </div>
        </div>

        <div aria-hidden="true" className="absolute right-3 top-1/2 h-32 w-px -translate-y-1/2 bg-white/15 sm:right-6">
          <div ref={barRef} className="h-full w-full origin-top scale-y-0 bg-[image:var(--chrome)]" />
        </div>
      </div>
    </section>
  )
}
