import type { SiteReview } from '@/lib/content'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

export function Reviews({ reviews }: { reviews: SiteReview[] }) {
  if (reviews.length === 0) return null
  return (
    <section id="reviews" className="scroll-mt-20 border-t border-line px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Відгуки" title="Що кажуть клієнти" />
        <ul className="mt-12 grid gap-4 md:grid-cols-3">
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
      </div>
    </section>
  )
}
