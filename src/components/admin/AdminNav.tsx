'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'

export const ADMIN_SECTIONS = [
  { href: '/admin', label: 'Огляд', short: 'Огляд' },
  { href: '/admin/bookings', label: 'Записи', short: 'Записи' },
  { href: '/admin/consultations', label: 'Консультації', short: 'Заявки' },
  { href: '/admin/clients', label: 'Клієнти', short: 'Клієнти' },
  { href: '/admin/services', label: 'Послуги', short: 'Послуги' },
  { href: '/admin/reviews', label: 'Відгуки', short: 'Відгуки' },
  { href: '/admin/settings', label: 'Налаштування', short: 'Налашт.' },
] as const

function useActive() {
  const path = usePathname()
  return (href: string) => (href === '/admin' ? path === '/admin' : path === href || path.startsWith(href + '/'))
}

export function AdminSidebar() {
  const active = useActive()
  return (
    <nav aria-label="Розділи" className="hidden lg:flex lg:flex-col lg:gap-1">
      {ADMIN_SECTIONS.map((s) => (
        <Link
          key={s.href}
          href={s.href}
          aria-label={s.label}
          title={s.label}
          aria-current={active(s.href) ? 'page' : undefined}
          className={cn(
            'flex min-h-11 items-center rounded-lg px-4 text-sm',
            active(s.href) ? 'bg-panel-2 text-fg' : 'text-muted hover:text-fg',
          )}
        >
          {s.label}
        </Link>
      ))}
    </nav>
  )
}

export function AdminTabBar() {
  const active = useActive()
  return (
    <nav
      aria-label="Розділи (мобільна панель)"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-panel pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {ADMIN_SECTIONS.map((s) => (
        <Link
          key={s.href}
          href={s.href}
          aria-label={s.label}
          title={s.label}
          aria-current={active(s.href) ? 'page' : undefined}
          className={cn(
            'flex min-h-14 min-w-0 flex-1 items-center justify-center px-0.5 text-center text-[11px] leading-tight',
            active(s.href) ? 'text-fg font-semibold' : 'text-muted',
          )}
        >
          {s.short}
        </Link>
      ))}
    </nav>
  )
}
