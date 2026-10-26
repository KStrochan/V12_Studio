import Image from 'next/image'
import { getHeroPhoto } from '@/lib/photos'
import { CtaLink } from './CtaLink'
import { GearsBackdrop } from './GearsBackdrop'
import { ChromeText } from "./ChromeText"
import { Reveal } from './Reveal'
import { ScrollHero } from './ScrollHero'
import { HERO_SEQUENCE } from '@/lib/heroSequence'

const FACTS = [
  { k: 'Гарантія', v: 'на роботи' },
  { k: 'Онлайн-запис', v: 'за 1 хвилину' },
]

export function Hero() {
  // Scroll-driven video version once frames exist (docs/HERO-VIDEO.md); otherwise the photo hero below.
  if (HERO_SEQUENCE) return <ScrollHero sequence={HERO_SEQUENCE} facts={FACTS} />
  const photo = getHeroPhoto()
  return (
    <section id="top" className="relative isolate overflow-hidden px-4 pb-24 pt-28 sm:px-6 lg:pb-32 lg:pt-40">
      {/* Placeholder stock photo (see docs/PHOTOS.md); decorative backdrop, so empty alt. */}
      <Image
        src={photo.src}
        alt=""
        fill
        preload
        sizes="100vw"
        quality={60}
        placeholder={photo.blur ? 'blur' : 'empty'}
        blurDataURL={photo.blur}
        className="-z-20 object-cover object-center opacity-45"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(10,10,11,0.82)_0%,rgba(10,10,11,0.7)_45%,#0a0a0b_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_75%_30%,rgba(184,188,196,0.14),transparent_70%),radial-gradient(40%_40%_at_10%_90%,rgba(110,115,125,0.12),transparent_70%)]"
      />
      <GearsBackdrop className="absolute -right-24 top-10 -z-10 w-[26rem] opacity-40 sm:-right-10 sm:w-[34rem] lg:right-0 lg:top-16 lg:w-[46rem] lg:opacity-50" />

      <div className="mx-auto max-w-6xl">
        <Reveal mode="load" y={12}>
          <p className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/60">
            <span className="h-px w-8 bg-[image:var(--chrome)]" />
            Автосервіс · Стрий
          </p>
        </Reveal>

        <Reveal mode="load" delay={0.1}>
          <h1 className="mt-6 font-heading text-[clamp(1.9rem,9.6vw,5.5rem)] font-semibold uppercase leading-[1.05] tracking-[0.04em]">
            Точний ремонт.
            <br />
            <ChromeText>Характер V12.</ChromeText>
          </h1>
        </Reveal>

        <Reveal mode="load" delay={0.25}>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
            Діагностика, ходова, двигун, електрика та кузов.
          </p>
        </Reveal>

        <Reveal mode="load" delay={0.4} className="mt-9 flex flex-col gap-3 sm:flex-row">
          <CtaLink href="#booking" magnetic>
            Записатися
          </CtaLink>
          <CtaLink href="#consultation" variant="ghost" magnetic>
            Консультація
          </CtaLink>
        </Reveal>

        <Reveal mode="load" delay={0.55}>
          <dl className="mt-14 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line">
            {FACTS.map((f) => (
              <div key={f.k} className="bg-panel/90 px-3 py-4 sm:px-5">
                <dt className="chrome-text font-heading text-[0.7rem] font-semibold uppercase tracking-wider sm:text-xs">
                  {f.k}
                </dt>
                <dd className="mt-1 text-xs text-muted sm:text-sm">{f.v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  )
}
