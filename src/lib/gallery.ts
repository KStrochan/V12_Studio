/** Wraps an index into [0, length). Returns 0 for an empty list. */
export function wrapIndex(index: number, length: number): number {
  if (length <= 0) return 0
  return ((index % length) + length) % length
}

/** Swipe direction from a horizontal drag: -1 = swipe left (next), 1 = swipe right (previous), 0 = ignore. */
export function swipeDirection(dx: number, dy: number, threshold = 50): -1 | 0 | 1 {
  if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.2) return 0
  return dx < 0 ? -1 : 1
}
