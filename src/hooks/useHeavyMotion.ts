'use client'

import { useSyncExternalStore } from 'react'

type Env = {
  matchMedia?: (q: string) => { matches: boolean }
  navigator?: { hardwareConcurrency?: number }
}

/** Heavy motion only on a desktop-class screen with a capable CPU and no reduced-motion preference. */
export function computeHeavyMotion(env: Env): boolean {
  if (!env.matchMedia) return false
  if (env.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  if (!env.matchMedia('(min-width: 1024px)').matches) return false
  return (env.navigator?.hardwareConcurrency ?? 0) >= 4
}

const QUERIES = ['(prefers-reduced-motion: reduce)', '(min-width: 1024px)']

function subscribe(onChange: () => void) {
  const lists = QUERIES.map((q) => window.matchMedia(q))
  lists.forEach((l) => l.addEventListener('change', onChange))
  return () => lists.forEach((l) => l.removeEventListener('change', onChange))
}

function getSnapshot() {
  return computeHeavyMotion({
    matchMedia: (q) => window.matchMedia(q),
    navigator: window.navigator,
  })
}

export function useHeavyMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
