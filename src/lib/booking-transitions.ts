export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'done' | 'cancelled'

export const BOOKING_STATUSES: readonly BookingStatus[] = [
  'pending',
  'confirmed',
  'rejected',
  'done',
  'cancelled',
]

const ALLOWED: Record<BookingStatus, readonly BookingStatus[]> = {
  pending: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['done', 'cancelled'],
  rejected: [],
  done: [],
  cancelled: [],
}

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return ALLOWED[from]?.includes(to) ?? false
}

/** Statuses that occupy a post (mirrors the DB exclusion constraint). */
export const isActiveStatus = (s: BookingStatus) => s === 'pending' || s === 'confirmed'

export const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Очікує',
  confirmed: 'Підтверджено',
  rejected: 'Відхилено',
  done: 'Виконано',
  cancelled: 'Скасовано',
}
