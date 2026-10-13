import { getSiteContent, callHref } from '@/lib/content'
import { Header } from '@/components/site/Header'
import { Footer } from '@/components/site/Footer'
import { FloatingCta } from '@/components/site/FloatingCta'

export default async function SiteLayout({ children }: LayoutProps<'/'>) {
  const { settings } = await getSiteContent()
  return (
    <>
      <Header phone={settings.phone} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
      <FloatingCta phoneHref={callHref(settings.phone)} />
    </>
  )
}
