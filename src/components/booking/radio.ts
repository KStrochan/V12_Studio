import type { KeyboardEvent } from 'react'

/** Arrow-key navigation across enabled [role=radio] children of a radiogroup. */
export function radioKeyDown(e: KeyboardEvent<HTMLElement>, selectOnMove = true) {
  const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']
  if (!keys.includes(e.key)) return
  const radios = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]:not([disabled])'))
  const i = radios.indexOf(document.activeElement as HTMLElement)
  if (i < 0) return
  e.preventDefault()
  const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
  const next = radios[(i + dir + radios.length) % radios.length]
  next.focus()
  if (selectOnMove) next.click()
}
