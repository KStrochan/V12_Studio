import { cn } from '@/lib/cn'
import { STATUS_LABEL, type BookingStatus } from '@/lib/booking-transitions'
import { STATUS_STYLE } from '@/lib/admin-bookings-ui'

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      data-status={status}
      className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs', STATUS_STYLE[status])}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}
