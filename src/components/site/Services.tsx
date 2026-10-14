import type { SiteService } from '@/lib/content'
import { getServiceIcon } from '@/components/icons/ServiceIcons'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

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
          {services.map((s, i) => {
            const Icon = getServiceIcon(s.icon)
            return (
            <Reveal as="li" key={s.id} delay={(i % 4) * 0.08} className="h-full">
              <article className="group chrome-border relative flex h-full flex-col overflow-hidden rounded-2xl p-6 transition-transform duration-500 hover:-translate-y-1">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.12)_50%,transparent_70%)] transition-transform duration-700 ease-out group-hover:translate-x-full max-lg:hidden motion-reduce:hidden"
                />
                <Icon className="size-9 text-white/80 transition-[color,filter] duration-500 group-hover:text-white group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.35)]" />
                <h3 className="mt-5 font-heading text-sm font-semibold uppercase tracking-wider">{s.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{s.description}</p>
              </article>
            </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
