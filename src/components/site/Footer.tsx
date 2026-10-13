import { callHref, formatHours, type SiteSettings } from '@/lib/content'

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="border-t border-line bg-bg px-4 pb-28 pt-12 sm:px-6 lg:pb-12">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3">
        <div>
          <p className="chrome-text font-heading text-lg font-semibold uppercase tracking-[0.22em]">V12 Service</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            Автосервіс у Стрию. Діагностика, ремонт і обслуговування з гарантією.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-heading text-xs uppercase tracking-[0.2em] text-white/60">Контакти</p>
          {callHref(settings.phone) ? (
            <a href={callHref(settings.phone)!} className="mt-3 flex min-h-11 items-center text-white">
              {settings.phone}
            </a>
          ) : (
            <p className="mt-3 text-white/80">{settings.phone}</p>
          )}
          <p className="text-muted">{settings.address}</p>
        </div>
        <div className="text-sm">
          <p className="font-heading text-xs uppercase tracking-[0.2em] text-white/60">Графік роботи</p>
          <ul className="mt-3 space-y-1.5 text-muted">
            {formatHours(settings.working_hours).map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl text-xs text-white/60">© V12 Service, Стрий. Усі права захищено.</p>
    </footer>
  )
}
