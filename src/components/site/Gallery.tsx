'use client'

import Image from 'next/image'
import { useCallback, useRef, useState } from 'react'
import { useHeavyMotion } from '@/hooks/useHeavyMotion'
import { getGalleryPhotos } from '@/lib/photos'
import { cn } from '@/lib/cn'
import { Lightbox } from './Lightbox'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

const photos = getGalleryPhotos()

export function Gallery() {
  const heavy = useHeavyMotion()
  const [open, setOpen] = useState<number | null>(null)
  const thumbs = useRef<(HTMLButtonElement | null)[]>([])
  const lastShown = useRef(0)

  const close = useCallback(() => {
    setOpen(null)
    // return focus to the thumbnail of the photo that was shown last
    requestAnimationFrame(() => thumbs.current[lastShown.current]?.focus())
  }, [])

  const show = useCallback((i: number) => {
    lastShown.current = i
    setOpen(i)
  }, [])

  return (
    <section id="gallery" className="scroll-mt-20 px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Галерея" title="Наш сервіс" lead="Діагностика, ходова, гальма, двигун і електрика: з чим ми працюємо щодня." />
        <ul className="mt-10 columns-2 gap-3 sm:gap-4 lg:columns-3">
          {photos.map((p, i) => (
            <Reveal as="li" key={p.src} delay={(i % 3) * 0.08} className="mb-3 break-inside-avoid sm:mb-4">
              <button
                type="button"
                ref={(el) => {
                  thumbs.current[i] = el
                }}
                onClick={() => show(i)}
                aria-label={`Відкрити фото: ${p.alt}`}
                aria-haspopup="dialog"
                className="group relative block min-h-11 w-full overflow-hidden rounded-xl border border-line bg-panel focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                <Image
                  src={p.src}
                  alt=""
                  width={p.width}
                  height={p.height}
                  sizes="(min-width: 1152px) 368px, (min-width: 1024px) 33vw, 50vw"
                  quality={60}
                  placeholder={p.blur ? 'blur' : 'empty'}
                  blurDataURL={p.blur}
                  loading="lazy"
                  className={cn('h-auto w-full', heavy && 'transition-transform duration-700 ease-out group-hover:scale-105')}
                />
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </button>
            </Reveal>
          ))}
        </ul>
        <p className="mt-6 max-w-2xl text-xs leading-relaxed text-muted">
          Фото ілюстративні: це безкоштовні стокові знімки (Unsplash), а не фотографії нашої майстерні. Власні фото сервісу додамо згодом.
        </p>
      </div>
      {open !== null && <Lightbox photos={photos} index={open} onIndex={show} onClose={close} />}
    </section>
  )
}
