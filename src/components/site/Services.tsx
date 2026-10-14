import type { SiteService } from '@/lib/content'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

const ICONS: Record<string, string> = {
  scan: 'M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16',
  suspension: 'M7 4v6a5 5 0 0 0 10 0V4M12 15v5M9 20h6',
  oil: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z',
  engine: 'M4 9h3l2-2h6l2 2h3v7h-3l-2 2H9l-2-2H4ZM2 12v1M22 12v1',
  bolt: 'M13 3 5 13h6l-1 8 8-10h-6l1-8Z',
  brake: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  body: 'M3 15l2-6a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 6v3H3Zm3 3v1m12-1v1M3 13h18',
  tire: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
}

export function Services({ services }: { services: SiteService[] }) {
  return (
    <section id="services" className="scroll-mt-20 px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Послуги"
          title="Усе для вашого авто"
        />
        {services.length === 0 ? (
          <p className="mt-12 text-muted">Послуги скоро з’являться.</p>
        ) : null}
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s, i) => (
            <Reveal as="li" key={s.id} delay={(i % 4) * 0.08} className="h-full">
              <article className="group chrome-border relative flex h-full flex-col overflow-hidden rounded-2xl p-6 transition-transform duration-500 hover:-translate-y-1">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.12)_50%,transparent_70%)] transition-transform duration-700 ease-out group-hover:translate-x-full max-lg:hidden motion-reduce:hidden"
                />
                <svg viewBox="0 0 24 24" className="size-8 text-white/80" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={ICONS[s.icon] ?? ICONS.scan} />
                </svg>
                <h3 className="mt-5 font-heading text-sm font-semibold uppercase tracking-wider">{s.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{s.description}</p>
              </article>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
