import { getSiteContent } from '@/lib/content'
import { jsonLdScript, localBusinessJsonLd } from '@/lib/jsonld'
import { normalizeUaPhone } from '@/lib/phone'
import { Hero } from '@/components/site/Hero'
import { Services } from '@/components/site/Services'
import { WhyUs } from '@/components/site/WhyUs'
import { Process } from '@/components/site/Process'
import { Gallery } from '@/components/site/Gallery'
import { BookingWizard } from '@/components/booking/BookingWizard'
import { ConsultationForm } from '@/components/site/ConsultationForm'
import { Reviews } from '@/components/site/Reviews'
import { Contacts } from '@/components/site/Contacts'

export default async function HomePage() {
  const { settings, services, reviews } = await getSiteContent()
  const e164 = normalizeUaPhone(settings.phone)
  const telegramUrl = settings.socials.telegram?.startsWith('https://') ? settings.socials.telegram : undefined
  const viberUrl = e164 ? `viber://chat?number=${encodeURIComponent(e164)}` : undefined

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(localBusinessJsonLd(settings)) }} />
      <Hero />
      <Services services={services} />
      <WhyUs />
      <Process />
      <Gallery />
      <BookingWizard services={services} workingHours={settings.working_hours} address={settings.address} phone={settings.phone} />
      <ConsultationForm telegramUrl={telegramUrl} viberUrl={viberUrl} />
      <Reviews reviews={reviews} />
      <Contacts settings={settings} />
    </>
  )
}
