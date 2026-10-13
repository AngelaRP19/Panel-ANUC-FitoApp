import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

// Tonos de la píldora de estado (af-estado). No hay tono «reabierto»: los casos no se reabren.
export type BadgeTone =
  'neutral' | 'info' | 'warning' | 'review' | 'success' | 'inactive' | 'danger'

const TONES: Record<BadgeTone, string> = {
  neutral: 'border border-borde-control bg-blanco text-neutro',
  info: 'bg-info-suave text-info',
  warning: 'bg-advertencia-suave text-advertencia',
  review: 'bg-revision-suave text-revision',
  success: 'bg-verde-100 text-verde-700',
  inactive: 'bg-inactivo-suave text-inactivo',
  danger: 'bg-peligro-suave text-peligro',
}

/** Píldora de estado con punto de color y texto (el color nunca va solo). */
export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex h-6.5 items-center gap-1.5 rounded-pill px-2.5 text-nota font-semibold whitespace-nowrap',
        'before:size-2 before:flex-none before:rounded-full before:bg-current',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
