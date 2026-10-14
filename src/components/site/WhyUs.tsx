import { CountUp } from './CountUp'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

const POINTS = [
  { t: 'Гарантія на роботи', d: 'Відповідаємо за результат і не ховаємося після оплати.' },
]

/** Placeholder figures; replace with real numbers from the owner. */
const STATS = [
  { to: 8, suffix: '', label: 'напрямків робіт' },
  { to: 500, suffix: '+', label: 'обслужених авто' },
  { to: 100, suffix: '%', label: 'робіт із гарантією' },
]

export function WhyUs() {
  return (
    <section id="why" className="scroll-mt-20 border-y border-line bg-panel/40 px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Чому ми" title="Сервіс без компромісів" />
        <dl className="mt-12 grid grid-cols-3 gap-3 sm:gap-6">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.1} className="rounded-2xl border border-line bg-panel px-3 py-6 text-center sm:py-8">
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <CountUp to={s.to} suffix={s.suffix} className="chrome-text font-heading text-3xl font-semibold sm:text-5xl" />
                <span className="mt-2 block text-xs text-muted sm:text-sm">{s.label}</span>
              </dd>
            </Reveal>
          ))}
        </dl>
        <ul className="mt-10 grid gap-4">
          {POINTS.map((p, i) => (
            <Reveal as="li" key={p.t} delay={i * 0.1} className="rounded-2xl border border-line p-6">
              <h3 className="font-heading text-sm font-semibold uppercase tracking-wider">{p.t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{p.d}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
