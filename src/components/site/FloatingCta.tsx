export function FloatingCta({ phoneHref }: { phoneHref: string | null }) {
  return (
    <div data-floating-cta className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 lg:hidden">
      <a
        href="#booking"
        className="pointer-events-auto flex min-h-12 flex-1 items-center justify-center rounded-full bg-[image:var(--chrome)] text-sm font-semibold text-black shadow-[0_10px_40px_-8px_rgba(0,0,0,0.9)]"
      >
        Записатися
      </a>
      {phoneHref && (
        <a
          href={phoneHref}
          aria-label="Зателефонувати"
          className="chrome-border pointer-events-auto flex size-12 shrink-0 items-center justify-center rounded-full shadow-[0_10px_40px_-8px_rgba(0,0,0,0.9)]"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
          </svg>
        </a>
      )}
    </div>
  )
}
