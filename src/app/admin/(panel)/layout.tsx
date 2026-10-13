import { Suspense } from 'react'
import { AdminSidebar, AdminTabBar } from '@/components/admin/AdminNav'
import { requireOwner } from '@/lib/auth-server'
import { logoutAction } from '../actions'

// Defense in depth: re-verify the owner here even though proxy.ts already gates /admin/*.
async function Guarded({ children }: { children: React.ReactNode }) {
  const { user } = await requireOwner()
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="hidden border-r border-line bg-panel p-4 lg:flex lg:flex-col lg:gap-6">
        <p className="font-heading text-lg">V12 Адмінка</p>
        <AdminSidebar />
        <form action={logoutAction} className="mt-auto">
          <p className="mb-2 truncate text-xs text-muted">{user.email}</p>
          <button type="submit" className="min-h-11 w-full rounded-lg border border-line px-4 text-sm">
            Вийти
          </button>
        </form>
      </aside>
      <div className="pb-20 lg:pb-0">
        <header className="flex items-center justify-between border-b border-line px-4 py-2 lg:hidden">
          <p className="font-heading">V12 Адмінка</p>
          <form action={logoutAction}>
            <button type="submit" className="min-h-11 rounded-lg px-3 text-sm text-muted">
              Вийти
            </button>
          </form>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
      <AdminTabBar />
    </div>
  )
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-4 text-muted">Завантаження…</p>}>
      <Guarded>{children}</Guarded>
    </Suspense>
  )
}
