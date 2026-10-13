import type { CSSProperties } from 'react'
import { cn } from '@/utils/cn'

/** Bloque de carga (pf-skel). Sin animación: respeta el movimiento reducido. */
export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <span aria-hidden="true" className={cn('esqueleto', className)} style={style} />
}
