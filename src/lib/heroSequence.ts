import type { HeroSequence } from '@/components/site/scrollSequence'

/**
 * Scroll-driven hero video, cut into frames by scripts/hero-frames.mjs (which rewrites this file).
 * null = no video yet: the hero shows the regular photo version. See docs/HERO-VIDEO.md.
 */
export const HERO_SEQUENCE: HeroSequence | null = {
  "desktop": {
    "dir": "/hero-seq/desktop",
    "count": 140,
    "width": 1280,
    "height": 676
  },
  "mobile": {
    "dir": "/hero-seq/mobile",
    "count": 100,
    "width": 720,
    "height": 1280
  },
  "poster": "/hero-seq/poster.webp"
}
