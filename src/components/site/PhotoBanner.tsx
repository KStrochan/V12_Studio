import Image from 'next/image'
import { getBannerPhoto } from '@/lib/photos'
import { CtaLink } from './CtaLink'
import { Reveal } from './Reveal'

export function PhotoBanner() {
  const photo = getBannerPhoto()
  return (
    <section aria-labelledby="banner-title" className="relative isolate overflow-hidden px-4 py-20 sm:px-6 lg:py-28">
      {/* Placeholder stock photo (see docs/PHOTOS.md); decorative, so empty alt. */}
      <Image
        src={photo.src}
        alt=""
        fill
        sizes="100vw"
        quality={60}
        loading="lazy"
        placeholder={photo.blur ? 'blur' : 'empty'}
        blurDataURL={photo.blur}
        className="-z-20 object-cover object-center"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(10,10,11,0.92)_0%,rgba(10,10,11,0.75)_60%,rgba(10,10,11,0.55)_100%)]" />
      <Reveal className="mx-auto max-w-6xl">
        <h2
          id="banner-title"
          className="max-w-xl font-heading text-[clamp(1.5rem,6.5vw,2.75rem)] font-semibold uppercase leading-[1.1] tracking-[0.04em]"
        >
          Не чекайте поломки: перевірте авто вчасно
        </h2>
        <p className="mt-4 max-w-md text-base leading-relaxed text-white/80">Оберіть послугу й зручний час, а ми підтвердимо запис.</p>
        <div className="mt-8">
          <CtaLink href="#booking">Записатися</CtaLink>
        </div>
      </Reveal>
    </section>
  )
}
