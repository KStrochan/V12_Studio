'use client'

import type { ReactNode } from 'react'
import { useHeavyMotion } from '@/hooks/useHeavyMotion'
import { cn } from '@/lib/cn'

/** Chrome gradient text; the slow sheen runs only on heavy-motion devices. */
export function ChromeText({ children }: { children: ReactNode }) {
  const heavy = useHeavyMotion()
  return <span className={cn('chrome-text', heavy && 'chrome-text-animated')}>{children}</span>
}
