'use client'

import { useState } from 'react'
import { motion, useDragControls, useReducedMotion } from 'framer-motion'
import { AdminDialog, btnCls, btnPrimaryCls } from '@/components/admin/AdminDialog'
import { canTransition, type BookingStatus } from '@/lib/booking-transitions'
import { kyivLongDay, kyivDay, kyivTime, swipeAction, type BookingView } from '@/lib/admin-bookings-ui'
import { StatusBadge } from './StatusBadge'


export function BookingCard({
  booking: b,
  busy,
  onStatus,
  onReschedule,
  showDate = true,
}: {
  booking: BookingView
  busy: boolean
  onStatus: (id: string, status: BookingStatus) => void
  onReschedule: (b: BookingView) => void
  showDate?: boolean
}) {
  const reduce = useReducedMotion()
  const controls = useDragControls()
  const [confirmReject, setConfirmReject] = useState(false)
  const pending = b.status === 'pending'
  const active = pending || b.status === 'confirmed'
  return (
    <>
    <motion.li
      data-testid="booking-card"
      data-booking-id={b.id}
      data-status={b.status}
      className="list-none rounded-xl border border-line bg-panel p-4 touch-pan-y"
      // Swipe is a shortcut for touch users; the buttons below are always available.
      drag={pending && !busy && !reduce ? 'x' : false}
      dragControls={controls}
      dragListener={false}
      onPointerDown={(e) => {
        if (e.pointerType !== 'mouse') controls.start(e)
      }}
      dragSnapToOrigin
      dragElastic={0.4}
      onDragEnd={(_, info) => {
        const action = swipeAction(info.offset.x)
        if (action === 'confirm') onStatus(b.id, 'confirmed')
        else if (action === 'reject') setConfirmReject(true)
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-heading text-lg">
            {kyivTime(b.start)}–{kyivTime(b.end)}
            {showDate ? <span className="ml-2 text-sm text-muted">{kyivLongDay(kyivDay(b.start))}</span> : null}
          </p>
          <p className="text-sm text-muted">Пост {b.postNo} · {b.service}</p>
        </div>
        <StatusBadge status={b.status} />
      </div>
      <p className="mt-2">{b.clientName}</p>
      <p className="text-sm text-muted">
        <a href={`tel:${b.phone}`} className="inline-flex min-h-11 items-center underline">
          {b.phone}
        </a>
        {b.car ? ` · ${b.car}` : ''}
      </p>
      {b.carYear ? <p className="text-sm text-muted">Рік: {b.carYear}</p> : null}
      {b.comment ? <p className="mt-1 text-sm text-muted">{b.comment}</p> : null}
      {pending ? <p className="mt-1 text-xs text-muted md:hidden">Свайп вправо підтвердити, вліво відхилити</p> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {canTransition(b.status, 'confirmed') ? (
          <button type="button" disabled={busy} onClick={() => onStatus(b.id, 'confirmed')} className={btnPrimaryCls}>
            Підтвердити
          </button>
        ) : null}
        {canTransition(b.status, 'rejected') ? (
          <button type="button" disabled={busy} onClick={() => setConfirmReject(true)} className={btnCls}>
            Відхилити
          </button>
        ) : null}
        {canTransition(b.status, 'done') ? (
          <button type="button" disabled={busy} onClick={() => onStatus(b.id, 'done')} className={btnPrimaryCls}>
            Виконано
          </button>
        ) : null}
        {active ? (
          <button type="button" disabled={busy} onClick={() => onReschedule(b)} className={btnCls}>
            Перенести
          </button>
        ) : null}
        {canTransition(b.status, 'cancelled') ? (
          <button type="button" disabled={busy} onClick={() => onStatus(b.id, 'cancelled')} className={btnCls}>
            Скасувати
          </button>
        ) : null}
      </div>
    </motion.li>
    {confirmReject ? (
      <AdminDialog title="Відхилити запис?" onClose={() => setConfirmReject(false)}>
        <p className="text-sm text-muted">Відхилений запис не можна відновити.</p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setConfirmReject(false)
              onStatus(b.id, 'rejected')
            }}
            className={btnPrimaryCls}
          >
            Так
          </button>
          <button type="button" onClick={() => setConfirmReject(false)} className={btnCls}>
            Ні
          </button>
        </div>
      </AdminDialog>
    ) : null}
    </>
  )
}
