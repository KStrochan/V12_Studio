import { CtaLink } from './CtaLink'
import { ChromeText } from './ChromeText'
import { HeroVideo } from './HeroVideo'
import { Reveal } from './Reveal'
import { RotatingWords } from './RotatingWords'

const FACTS = [
  { k: 'Гарантія', v: 'на роботи' },
  { k: 'Онлайн-запис', v: 'за 1 хвилину' },
]

const SERVICES = ['Діагностика.', 'Ходова.', 'Двигун.', 'Електрика.', 'Кузов.']

export function Hero() {
  return (
    <section id="top" className="relative isolate flex min-h-svh items-center overflow-hidden px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
      {/* Stock video (see docs/HERO-VIDEO.md); decorative, so hidden from screen readers. */}
      <HeroVideo />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(10,10,11,0.85)_0%,rgba(10,10,11,0.55)_45%,rgba(10,10,11,0.15)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(10,10,11,0.55)_0%,transparent_25%,transparent_70%,#0a0a0b_100%)]"
      />

      <div className="mx-auto w-full max-w-6xl">
        <Reveal mode="load" y={12} delay={0.2}>
          <p className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/70">
            <span className="h-px w-8 bg-[image:var(--chrome)]" />
            Автосервіс · Стрий
          </p>
        </Reveal>

        <Reveal mode="load" delay={0.45}>
          <h1 className="mt-6 font-heading text-[clamp(1.9rem,9.6vw,5.5rem)] font-semibold uppercase leading-[1.05] tracking-[0.04em]">
            Точний ремонт.
            <br />
            <ChromeText>Характер V12.</ChromeText>
          </h1>
        </Reveal>

        <Reveal mode="load" delay={0.9}>
          <RotatingWords
            words={SERVICES}
            className="mt-5 block font-heading text-[clamp(1.4rem,6vw,3.2rem)] font-semibold uppercase leading-none tracking-[0.04em]"
          />
        </Reveal>

        <Reveal mode="load" delay={1.3} className="mt-10 flex flex-col gap-3 sm:flex-row">
          <CtaLink href="#booking" magnetic>
            Записатися
          </CtaLink>
          <CtaLink href="#consultation" variant="ghost" magnetic>
            Консультація
          </CtaLink>
        </Reveal>

        <Reveal mode="load" delay={1.6}>
          <dl className="mt-14 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line">
            {FACTS.map((f) => (
              <div key={f.k} className="bg-panel/90 px-3 py-4 sm:px-5">
                <dt className="chrome-text font-heading text-[0.7rem] font-semibold uppercase tracking-wider sm:text-xs">
                  {f.k}
                </dt>
                <dd className="mt-1 text-xs text-muted sm:text-sm">{f.v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  )
}
