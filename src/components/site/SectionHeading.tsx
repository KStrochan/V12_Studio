import { Reveal } from './Reveal'

export function SectionHeading({ eyebrow, title, lead }: { eyebrow: string; title: string; lead?: string }) {
  return (
    <Reveal className="max-w-2xl">
      <p className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/60">
        <span className="h-px w-8 bg-[image:var(--chrome)]" />
        {eyebrow}
      </p>
      <h2 className="mt-4 font-heading text-[clamp(1.5rem,6.5vw,2.75rem)] font-semibold uppercase leading-[1.1] tracking-[0.04em]">
        {title}
      </h2>
      {lead ? <p className="mt-4 text-base leading-relaxed text-white/70">{lead}</p> : null}
    </Reveal>
  )
}
