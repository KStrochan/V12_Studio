/** Pure helpers for the scroll-driven hero (frame sequence drawn on a canvas). */

export type SequenceSet = {
  /** Folder under /public, e.g. "/hero-seq/desktop". Frames are named f001.webp, f002.webp, … */
  dir: string
  count: number
  width: number
  height: number
}

export type HeroSequence = {
  desktop: SequenceSet
  /** Portrait crop for phones; falls back to desktop when missing. */
  mobile?: SequenceSet
  /** First frame as a still, shown before JS and for reduced motion. */
  poster: string
}

export const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : Number.isFinite(n) ? n : 0)

/** Scroll progress through a tall section whose child is sticky: 0 at the top, 1 when it is about to leave. */
export function sectionProgress(rectTop: number, rectHeight: number, viewport: number): number {
  const travel = rectHeight - viewport
  if (travel <= 0) return 0
  return clamp01(-rectTop / travel) + 0 // + 0 normalises -0
}

export function frameAt(progress: number, count: number): number {
  if (count <= 1) return 0
  return Math.round(clamp01(progress) * (count - 1))
}

export function frameSrc(set: SequenceSet, index: number): string {
  return `${set.dir}/f${String(index + 1).padStart(3, '0')}.webp`
}

/**
 * Order in which to fetch frames: a coarse pass first (every 8th, then 4th, 2nd, 1st), so the whole
 * scroll range becomes usable quickly and detail fills in afterwards.
 */
export function loadOrder(count: number): number[] {
  const seen = new Set<number>()
  const order: number[] = []
  for (const step of [8, 4, 2, 1]) {
    for (let i = 0; i < count; i += step) {
      if (!seen.has(i)) {
        seen.add(i)
        order.push(i)
      }
    }
  }
  if (count > 0 && !seen.has(count - 1)) order.push(count - 1)
  return order
}

/** Nearest index that is already loaded (looks both ways), or -1. */
export function nearestLoaded(target: number, loaded: ArrayLike<boolean>): number {
  for (let d = 0; d < loaded.length; d++) {
    if (loaded[target - d]) return target - d
    if (loaded[target + d]) return target + d
  }
  return -1
}

/**
 * Opacity of a caption shown during [start, end] of the scroll, with a fade of `fade` on each side.
 * end >= 1 means the caption stays fully visible at the very end.
 */
export function beatOpacity(progress: number, start: number, end: number, fade = 0.06): number {
  const p = clamp01(progress)
  if (start <= 0 && p <= end - fade) return 1
  if (end >= 1 && p >= start + fade) return 1
  if (p <= start - fade || p >= end + fade) return 0
  if (p < start + fade) return clamp01((p - (start - fade)) / (2 * fade))
  if (p > end - fade) return clamp01(((end + fade) - p) / (2 * fade))
  return 1
}

/** Rectangle that covers a W×H box with an image of size iw×ih (like CSS object-fit: cover). */
export function coverRect(iw: number, ih: number, W: number, H: number) {
  const s = Math.max(W / iw, H / ih)
  const w = iw * s
  const h = ih * s
  return { x: (W - w) / 2, y: (H - h) / 2, w, h }
}
