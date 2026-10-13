import { CATEGORIA_LABEL, etiqueta } from '@/locales/es'
import type { Categoria } from '@/types/enums'
import { cn } from '@/utils/cn'
import { formatearPorcentaje } from '@/utils/numeros'
import { FormaCategoria } from './CategoriaMarca'

interface BarraCoincidenciaProps {
  categoria: Categoria | string
  porcentaje: number
  /** Categoría alternativa (resultado ambiguo): barra en verde claro. */
  alterna?: boolean
  className?: string
}

/**
 * Porcentaje de coincidencia de síntomas (af-coin). El valor va siempre en texto y la
 * barra tiene descripción accesible: «Botrytis: 58 % de coincidencia de síntomas».
 */
export function BarraCoincidencia({
  categoria,
  porcentaje,
  alterna = false,
  className,
}: BarraCoincidenciaProps) {
  const nombre = etiqueta(CATEGORIA_LABEL, categoria)
  const valor = Math.max(0, Math.min(100, porcentaje))
  const texto = formatearPorcentaje(valor)
  return (
    <div
      role="img"
      aria-label={`${nombre}: ${texto} de coincidencia de síntomas`}
      className={cn('grid grid-cols-[120px_1fr_48px] items-center gap-3 text-cuerpo-sm', className)}
    >
      <span className="inline-flex min-w-0 items-center gap-1.5">
        <FormaCategoria categoria={categoria} />
        <span className="truncate">{nombre}</span>
      </span>
      <span className="h-2.5 overflow-hidden rounded-pill bg-verde-100">
        <span
          className={cn('block h-full rounded-pill', alterna ? 'bg-verde-400' : 'bg-verde-600')}
          style={{ width: `${valor}%` }}
        />
      </span>
      <span className="text-right font-semibold tabular-nums">{texto}</span>
    </div>
  )
}
