import { CircleCheck, CircleHelp, MapPin, Shuffle, type LucideIcon } from 'lucide-react'
import { RESULTADO_TECNICO_LABEL, etiqueta } from '@/locales/es'
import type { ResultadoTecnico } from '@/types/enums'
import { cn } from '@/utils/cn'

const ESTILO: Record<ResultadoTecnico, { clase: string; icono: LucideIcon }> = {
  CONFIRMADO: { clase: 'bg-verde-100 text-verde-700', icono: CircleCheck },
  OTRA_PATOLOGIA: { clase: 'bg-revision-suave text-revision', icono: Shuffle },
  NO_IDENTIFICADO: { clase: 'bg-neutro-suave text-neutro', icono: CircleHelp },
  REQUIERE_VISITA: { clase: 'bg-advertencia-suave text-advertencia', icono: MapPin },
}

/**
 * Resultado técnico (decisión humana) con icono + texto (af-resultado). Va separado de la
 * insignia de estado del caso: son cosas distintas.
 */
export function ResultadoTecnicoBadge({
  resultado,
  detalle,
}: {
  resultado: ResultadoTecnico | string
  /** Categoría u otro dato que se agrega: «Confirmado: Botrytis». */
  detalle?: string | null
}) {
  const estilo = ESTILO[resultado as ResultadoTecnico] ?? ESTILO.NO_IDENTIFICADO
  const Icono = estilo.icono
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border border-current px-2.5 py-1 text-nota font-semibold',
        estilo.clase,
      )}
    >
      <Icono size={16} strokeWidth={1.75} aria-hidden="true" className="flex-none" />
      {etiqueta(RESULTADO_TECNICO_LABEL, resultado)}
      {detalle && `: ${detalle}`}
    </span>
  )
}
