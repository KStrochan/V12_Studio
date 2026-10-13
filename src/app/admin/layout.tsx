import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'Адмінка V12', template: '%s | Адмінка V12' },
  robots: { index: false, follow: false },
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
