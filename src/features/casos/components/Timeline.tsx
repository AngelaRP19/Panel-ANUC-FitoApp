import {
  Ban,
  Camera,
  ClipboardCheck,
  Clock,
  Lock,
  MessageCircle,
  Send,
  UserCheck,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatearFechaHora } from '@/utils/fechas'
import type { EventoHistorial } from '../types'

const ICONO: Record<string, LucideIcon> = {
  CREADO: MessageCircle,
  ANALISIS: Camera,
  ENVIADO: Send,
  ASIGNADO: UserCheck,
  DIAGNOSTICO: ClipboardCheck,
  CIERRE: Lock,
  DESCARTE: Ban,
}

/**
 * Línea de tiempo del caso (pf-tl, artboard 04f): cada paso con fecha, hora y responsable;
 * los pasos futuros aparecen como «Pendiente». No existe el evento «reabierto».
 */
export function Timeline({ eventos }: { eventos: EventoHistorial[] }) {
  return (
    <ol className="m-0 flex list-none flex-col p-0">
      {eventos.map((e, i) => {
        const Icono = e.pendiente ? Clock : (ICONO[e.tipo] ?? Clock)
        const ultimo = i === eventos.length - 1
        return (
          <li key={`${e.tipo}-${i}`} className="relative grid grid-cols-[28px_1fr] gap-x-3 pb-4">
            {!ultimo && (
              <span
                aria-hidden="true"
                className="absolute top-7 bottom-0 left-[13px] w-0.5 bg-borde"
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                'grid size-7 place-items-center rounded-full border',
                e.pendiente
                  ? 'border-dashed border-borde-control bg-blanco text-tinta-terciaria'
                  : 'border-verde-300 bg-verde-100 text-verde-700',
              )}
            >
              <Icono size={14} strokeWidth={2} />
            </span>
            <div>
              <p
                className={cn(
                  'text-cuerpo-sm font-semibold',
                  e.pendiente ? 'text-tinta-secundaria' : 'text-tinta',
                )}
              >
                {e.titulo}
              </p>
              <p className="text-nota text-tinta-terciaria tabular-nums">
                {e.pendiente || !e.en ? e.detalle : `${formatearFechaHora(e.en)} · ${e.detalle}`}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
