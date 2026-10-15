import type { SiteReview } from '@/lib/content'
import { GOOGLE_PLACE, googlePlaceUrl } from '@/lib/location'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

const ratingText = GOOGLE_PLACE.rating.toFixed(1).replace('.', ',')
const fillPct = Math.round((GOOGLE_PLACE.rating / 5) * 100)

function GoogleRatingCard() {
  return (
    <Reveal
      className="chrome-border mt-12 flex flex-col items-center gap-4 rounded-2xl px-6 py-10 text-center"
    >
      <p className="font-heading text-xs uppercase tracking-[0.2em] text-white/60">Google-рейтинг</p>
      <p className="chrome-text font-heading text-6xl font-bold leading-none">{ratingText}</p>
      <div
        role="img"
        aria-label={`Рейтинг ${ratingText} з 5 на основі ${GOOGLE_PLACE.reviewCount} відгуків на Google`}
        className="relative text-2xl leading-none tracking-widest"
      >
        <span aria-hidden="true" className="text-white/20">★★★★★</span>
        <span
          aria-hidden="true"
          className="chrome-text absolute inset-y-0 left-0 overflow-hidden whitespace-nowrap"
          style={{ width: `${fillPct}%` }}
        >
          ★★★★★
        </span>
      </div>
      <p className="text-sm text-white/70">{GOOGLE_PLACE.reviewCount} відгуків на Google Maps</p>
      <a
        href={googlePlaceUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-panel-2 px-5 font-heading text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
      >
        Читати відгуки на Google Maps
      </a>
    </Reveal>
  )
}

export function Reviews({ reviews }: { reviews: SiteReview[] }) {
  return (
    <section id="reviews" className="scroll-mt-20 border-t border-line px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Відгуки" title="Що кажуть клієнти" />
        <GoogleRatingCard />
        {reviews.length > 0 && (
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {reviews.map((r, i) => (
              <Reveal as="li" key={r.id} delay={(i % 3) * 0.1} className="flex flex-col rounded-2xl border border-line bg-panel p-6">
                <p role="img" aria-label={`Оцінка ${r.rating} з 5`} className="text-lg tracking-widest">
                  <span className="chrome-text">{'★'.repeat(r.rating)}</span>
                  <span className="text-white/20">{'★'.repeat(Math.max(0, 5 - r.rating))}</span>
                </p>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-white/80">{r.body}</blockquote>
                <p className="mt-5 font-heading text-xs uppercase tracking-wider text-white/60">{r.author}</p>
              </Reveal>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
