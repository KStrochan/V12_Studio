import Image from 'next/image'
import { callHref } from '@/lib/content'
import { MobileMenu } from './MobileMenu'
import { NAV } from './nav'

export function Header({ phone }: { phone: string }) {
  const href = callHref(phone)
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#top" aria-label="V12 Service, на початок" className="flex min-h-11 items-center gap-3">
          <Image
            src="/logo.webp"
            alt=""
            width={44}
            height={44}
            priority
            className="size-11 rounded-full ring-1 ring-white/20"
          />
          <span className="chrome-text font-heading text-sm font-semibold uppercase tracking-[0.22em]">V12 Service</span>
        </a>

        <nav aria-label="Основне меню" className="hidden items-center gap-8 lg:flex">
          {NAV.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="py-3 text-sm tracking-wide text-white/70 transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {href && (
            <a href={href} className="hidden min-h-11 items-center text-sm text-white/80 hover:text-white md:flex">
            {phone}
          </a>
          )}
          <a
            href="#booking"
            className="hidden min-h-11 items-center rounded-full bg-[image:var(--chrome)] px-5 text-sm font-semibold text-black lg:flex"
          >
            Записатися
          </a>
          <MobileMenu phone={phone} phoneHref={href} />
        </div>
      </div>
    </header>
  )
}
