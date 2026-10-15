import { callHref, formatHours, type SiteSettings } from '@/lib/content'
import { googleDirectionsUrl, googleEmbedUrl } from '@/lib/location'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

export function Contacts({ settings }: { settings: SiteSettings }) {
  const tel = callHref(settings.phone)
  return (
    <section id="contacts" className="scroll-mt-20 border-t border-line px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Контакти" title="Чекаємо у Стрию" />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Reveal className="space-y-6 rounded-2xl border border-line bg-panel p-6">
            <div>
              <p className="font-heading text-xs uppercase tracking-[0.2em] text-white/60">Адреса</p>
              <p className="mt-2 text-white">{settings.address}</p>
              <a
                href={googleDirectionsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-panel-2 px-5 font-heading text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
              >
                Побудувати маршрут
              </a>
            </div>
            <div>
              <p className="font-heading text-xs uppercase tracking-[0.2em] text-white/60">Телефон</p>
              {tel ? (
                <a href={tel} className="mt-1 flex min-h-11 items-center text-lg text-white">
                  {settings.phone}
                </a>
              ) : (
                <p className="mt-2 text-lg text-white">{settings.phone}</p>
              )}
            </div>
            <div>
              <p className="font-heading text-xs uppercase tracking-[0.2em] text-white/60">Графік роботи</p>
              <ul className="mt-2 space-y-1.5 text-muted">
                {formatHours(settings.working_hours).map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="overflow-hidden rounded-2xl border border-line bg-panel">
            <iframe
              title="Мапа: V12 Service, Стрий"
              src={googleEmbedUrl()}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-72 w-full border-0 grayscale invert-[0.92] contrast-90 lg:h-full lg:min-h-80"
            />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
