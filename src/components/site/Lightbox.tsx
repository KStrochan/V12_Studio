'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { swipeDirection, wrapIndex } from '@/lib/gallery'
import type { Photo } from '@/lib/photos'

type Props = {
  photos: Photo[]
  index: number
  onIndex: (i: number) => void
  onClose: () => void
}

const btn =
  'flex size-12 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white backdrop-blur transition-colors hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

export function Lightbox({ photos, index, onIndex, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const state = useRef({ index, onIndex, onClose, n: photos.length })

  useEffect(() => {
    state.current = { index, onIndex, onClose, n: photos.length }
  })

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    function onKey(e: KeyboardEvent) {
      const s = state.current
      if (e.key === 'Escape') {
        e.preventDefault()
        s.onClose()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        s.onIndex(wrapIndex(s.index + 1, s.n))
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        s.onIndex(wrapIndex(s.index - 1, s.n))
      } else if (e.key === 'Tab') {
        const items = dialogRef.current?.querySelectorAll<HTMLElement>('button')
        if (!items || items.length === 0) return
        const first = items[0]
        const last = items[items.length - 1]
        const active = document.activeElement
        if (!dialogRef.current?.contains(active)) {
          e.preventDefault()
          first.focus()
        } else if (e.shiftKey && active === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [])

  const photo = photos[index]
  if (!photo) return null

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Перегляд фото"
      className="fixed inset-0 z-[70] flex flex-col bg-black/95"
      onTouchStart={(e) => {
        const t = e.touches[0]
        touch.current = { x: t.clientX, y: t.clientY }
      }}
      onTouchEnd={(e) => {
        const start = touch.current
        touch.current = null
        if (!start) return
        const t = e.changedTouches[0]
        const dir = swipeDirection(t.clientX - start.x, t.clientY - start.y)
        if (dir !== 0) onIndex(wrapIndex(index - dir, photos.length))
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-sm text-white/70" aria-live="polite">
          {index + 1} / {photos.length}
        </p>
        <button ref={closeRef} type="button" aria-label="Закрити перегляд" onClick={onClose} className={btn}>
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16">
        <button
          type="button"
          aria-label="Попереднє фото"
          onClick={() => onIndex(wrapIndex(index - 1, photos.length))}
          className={`${btn} absolute left-2 z-10 sm:left-4`}
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 5-7 7 7 7" />
          </svg>
        </button>
        <Image
          key={photo.src}
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          sizes="100vw"
          quality={75}
          placeholder={photo.blur ? 'blur' : 'empty'}
          blurDataURL={photo.blur}
          draggable={false}
          className="max-h-full w-auto max-w-full select-none object-contain"
        />
        <button
          type="button"
          aria-label="Наступне фото"
          onClick={() => onIndex(wrapIndex(index + 1, photos.length))}
          className={`${btn} absolute right-2 z-10 sm:right-4`}
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9 5 7 7-7 7" />
          </svg>
        </button>
      </div>

      <p className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 text-center text-sm leading-relaxed text-white/80" data-testid="lightbox-caption">
        {photo.alt}
        {photo.credit ? <span className="mt-1 block text-xs text-white/50">{photo.credit}</span> : null}
      </p>
    </div>,
    document.body,
  )
}
