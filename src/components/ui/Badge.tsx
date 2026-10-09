import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type BadgeTone =
  'neutral' | 'info' | 'warning' | 'review' | 'success' | 'reopened' | 'inactive' | 'danger'

// Píldora de estado (af-estado). El mapeo estado → tono vive en cada feature.
const TONES: Record<BadgeTone, string> = {
  neutral: 'border border-borde-control bg-blanco text-neutro',
  info: 'bg-info-suave text-info',
  warning: 'bg-advertencia-suave text-advertencia',
  review: 'bg-revision-suave text-revision',
  success: 'bg-verde-100 text-verde-700',
  reopened: 'bg-reabierto-suave text-reabierto',
  inactive: 'bg-inactivo-suave text-inactivo',
  danger: 'bg-peligro-suave text-peligro',
}

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex h-6.5 items-center gap-1.5 rounded-pill px-2.5 text-nota font-semibold whitespace-nowrap',
        'before:size-2 before:rounded-full before:bg-current',
        TONES[tone],
      )}
    >
      {children}
    </span>
  )
}
