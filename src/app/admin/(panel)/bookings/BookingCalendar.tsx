'use client'

import { cn } from '@/lib/cn'
import { STATUS_STYLE, kyivMinutes, kyivTime, type BookingView } from '@/lib/admin-bookings-ui'

const FROM = 8 * 60
const TO = 20 * 60
const PX_PER_MIN = 0.9

/** Day grid: one column per post, hour lines, bookings positioned by Kyiv time. */
export function BookingCalendar({ bookings, posts }: { bookings: BookingView[]; posts: number }) {
  const hours = Array.from({ length: (TO - FROM) / 60 + 1 }, (_, i) => FROM / 60 + i)
  const height = (TO - FROM) * PX_PER_MIN
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-panel" role="group" aria-label="Календар дня">
      <div className="flex min-w-[20rem]" style={{ height: height + 32 }}>
        <div className="w-12 shrink-0 pt-8 text-xs text-muted" aria-hidden>
          <div className="relative" style={{ height }}>
            {hours.map((h) => (
              <span key={h} className="absolute right-2 -translate-y-1/2" style={{ top: (h * 60 - FROM) * PX_PER_MIN }}>
                {String(h).padStart(2, '0')}:00
              </span>
            ))}
          </div>
        </div>
        {Array.from({ length: posts }, (_, i) => i + 1).map((post) => (
          <div key={post} className="min-w-0 flex-1 border-l border-line">
            <p className="h-8 px-2 pt-1.5 text-xs text-muted">Пост {post}</p>
            <div className="relative" style={{ height }}>
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute inset-x-0 border-t border-line/60"
                  style={{ top: (h * 60 - FROM) * PX_PER_MIN }}
                />
              ))}
              {bookings
                .filter((b) => b.postNo === post && (b.status === 'pending' || b.status === 'confirmed' || b.status === 'done'))
                .map((b) => {
                  const s = Math.max(kyivMinutes(b.start), FROM)
                  const e = Math.min(kyivMinutes(b.end) || TO, TO)
                  return (
                    <div
                      key={b.id}
                      data-testid="calendar-block"
                      title={`${b.clientName}, ${b.service}`}
                      className={cn(
                        'absolute inset-x-1 overflow-hidden rounded-md border px-1.5 py-0.5 text-xs leading-tight',
                        STATUS_STYLE[b.status],
                      )}
                      style={{ top: (s - FROM) * PX_PER_MIN, height: Math.max((e - s) * PX_PER_MIN - 2, 18) }}
                    >
                      <span className="font-medium">{kyivTime(b.start)}</span> {b.clientName}
                    </div>
                  )
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
