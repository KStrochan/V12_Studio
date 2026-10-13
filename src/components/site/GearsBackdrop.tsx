'use client'

import { useHeavyMotion } from '@/hooks/useHeavyMotion'
import { cn } from '@/lib/cn'

function gearPath(teeth: number, rOuter: number, rRoot: number): string {
  const pts: string[] = []
  const step = (Math.PI * 2) / teeth
  for (let i = 0; i < teeth; i++) {
    const a = i * step
    const w = step * 0.22
    const p = (r: number, ang: number) => `${(Math.cos(ang) * r).toFixed(2)},${(Math.sin(ang) * r).toFixed(2)}`
    pts.push(p(rRoot, a - step * 0.5 + w * 0.2), p(rOuter, a - w), p(rOuter, a + w), p(rRoot, a + step * 0.5 - w * 0.2))
  }
  return `M${pts.join('L')}Z`
}

const BIG = gearPath(24, 200, 170)
const SMALL = gearPath(14, 120, 98)

function Gear({ d, hole, spin, className }: { d: string; hole: number; spin?: string; className?: string }) {
  return (
    <g className={cn(spin, className)}>
      <path d={d} fill="url(#gear-fill)" stroke="url(#gear-stroke)" strokeWidth="2" fillRule="evenodd" />
      <circle r={hole} fill="var(--bg)" stroke="url(#gear-stroke)" strokeWidth="2" />
      <circle r={hole * 0.35} fill="none" stroke="url(#gear-stroke)" strokeWidth="1.5" />
    </g>
  )
}

/** Decorative crossed pistons and meshing gears; rotation runs only on heavy-motion devices. */
export function GearsBackdrop({ className }: { className?: string }) {
  const heavy = useHeavyMotion()
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 800 800"
      className={cn('pointer-events-none select-none', className)}
    >
      <defs>
        <linearGradient id="gear-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f5f5f7" />
          <stop offset="0.5" stopColor="#6e737d" />
          <stop offset="1" stopColor="#d9dce2" />
        </linearGradient>
        <linearGradient id="gear-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1c1c1f" />
          <stop offset="1" stopColor="#0f0f11" />
        </linearGradient>
      </defs>
      <g transform="translate(470 330)">
        <Gear d={BIG} hole={70} spin={heavy ? 'gear-spin' : undefined} />
      </g>
      <g transform="translate(190 580) rotate(12)">
        <Gear d={SMALL} hole={44} spin={heavy ? 'gear-spin-rev' : undefined} />
      </g>
      {/* piston silhouettes */}
      <g
        fill="none"
        stroke="url(#gear-stroke)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      >
        <g transform="translate(590 590) rotate(32)">
          <rect x="-46" y="-80" width="92" height="96" rx="10" />
          <path d="M-46 -56H46M-46 -40H46M-46 -24H46" />
          <circle cy="-4" r="9" />
          <path d="M-14 16L-10 120M14 16L10 120" />
          <circle cy="134" r="20" />
        </g>
      </g>
    </svg>
  )
}
