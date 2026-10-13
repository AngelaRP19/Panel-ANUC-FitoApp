import type { ReactNode } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, type LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

export type TonoAviso = 'info' | 'adv' | 'peligro' | 'ok'

const TONOS: Record<TonoAviso, { caja: string; icono: LucideIcon; color: string }> = {
  info: { caja: 'bg-info-suave', icono: Info, color: 'text-info' },
  adv: { caja: 'bg-advertencia-suave', icono: AlertTriangle, color: 'text-advertencia' },
  peligro: { caja: 'bg-peligro-suave', icono: AlertCircle, color: 'text-peligro' },
  ok: { caja: 'bg-verde-100', icono: CheckCircle2, color: 'text-verde-700' },
}

interface AvisoProps {
  tono?: TonoAviso
  /** Texto en negrita al inicio («No pudimos iniciar sesión.»). */
  titulo?: string
  children?: ReactNode
  /** Sustituye el icono del tono. */
  icono?: LucideIcon
  /**
   * Rol ARIA. Por defecto: «alert» en peligro (se anuncia de inmediato), «status» en ok
   * y ninguno en info/adv (contenido estático).
   */
  rol?: 'alert' | 'status' | 'none'
  className?: string
}

/** Aviso en línea (pf-aviso). */
export function Aviso({ tono = 'info', titulo, children, icono, rol, className }: AvisoProps) {
  const { caja, icono: IconoTono, color } = TONOS[tono]
  const Icono = icono ?? IconoTono
  const rolFinal = rol ?? (tono === 'peligro' ? 'alert' : tono === 'ok' ? 'status' : 'none')
  return (
    <div
      role={rolFinal === 'none' ? undefined : rolFinal}
      className={cn(
        'flex items-start gap-3 rounded-md px-4 py-3 text-cuerpo-sm text-tinta',
        caja,
        className,
      )}
    >
      <Icono size={20} strokeWidth={1.75} className={cn('shrink-0', color)} aria-hidden="true" />
      <div className="min-w-0">
        {titulo && <b className="font-semibold">{titulo}</b>} {children}
      </div>
    </div>
  )
}
