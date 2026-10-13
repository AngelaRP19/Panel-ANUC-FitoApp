import { CATEGORIA_FORMA_LABEL, CATEGORIA_LABEL, etiqueta } from '@/locales/es'
import type { Categoria } from '@/types/enums'
import { cn } from '@/utils/cn'
import { formatearPorcentaje } from '@/utils/numeros'

// Forma + color de cada categoría (pf-forma / pf-bg-<categoria>).
const FORMA: Record<Categoria, string> = {
  TRIPS: 'bg-cat-trips forma-triangulo',
  BOTRYTIS: 'bg-cat-botrytis rounded-full',
  RONA: 'bg-cat-rona forma-rombo',
  FUSARIUM: 'bg-cat-fusarium forma-cruz',
  DEFICIENCIA_MAGNESIO: 'bg-cat-magnesio rounded-[1px] scale-[.86]',
}

interface FormaCategoriaProps {
  /** null: «No identificada» (círculo blanco con borde). */
  categoria: Categoria | string | null
  tamano?: number
  className?: string
}

/** Solo la forma, decorativa: el nombre siempre va al lado o en el texto accesible. */
export function FormaCategoria({ categoria, tamano = 12, className }: FormaCategoriaProps) {
  const forma = categoria ? FORMA[categoria as Categoria] : undefined
  return (
    <span
      aria-hidden="true"
      style={{ width: tamano, height: tamano }}
      className={cn(
        'inline-block flex-none',
        forma ?? 'rounded-full border-2 border-borde-control bg-blanco',
        className,
      )}
    />
  )
}

interface CategoriaMarcaProps {
  categoria: Categoria | string | null
  /** Porcentaje de coincidencia de síntomas («Botrytis 86 %»). */
  porcentaje?: number | null
  /** Texto cuando no hay categoría. */
  textoSinCategoria?: string
  /** Agrega la forma al texto accesible: «Trips (triángulo)». */
  nombrarForma?: boolean
  className?: string
}

/** Marca de categoría fitosanitaria: forma + color + nombre (nunca solo color). */
export function CategoriaMarca({
  categoria,
  porcentaje,
  textoSinCategoria = 'No identificada',
  nombrarForma = false,
  className,
}: CategoriaMarcaProps) {
  const nombre = categoria ? etiqueta(CATEGORIA_LABEL, categoria) : textoSinCategoria
  const forma = categoria && nombrarForma ? CATEGORIA_FORMA_LABEL[categoria as Categoria] : null
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-cuerpo-sm whitespace-nowrap text-tinta',
        className,
      )}
    >
      <FormaCategoria categoria={categoria} />
      <span>
        {nombre}
        {forma && <span className="sr-only"> ({forma})</span>}
        {porcentaje != null && categoria && (
          <span className="tabular-nums"> {formatearPorcentaje(porcentaje)}</span>
        )}
      </span>
    </span>
  )
}
