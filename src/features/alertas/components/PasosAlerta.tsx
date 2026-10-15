import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'

const PASOS = ['Revisar casos', 'Confirmar alerta', 'Redactar mensaje', 'Comunicar']

/** Pasos de la comunicación de una alerta (diseño 06b). `actual` empieza en 1. */
export function PasosAlerta({ actual }: { actual: number }) {
  return (
    <ol aria-label="Pasos" className="m-0 flex list-none flex-wrap gap-2 p-0">
      {PASOS.map((p, i) => {
        const n = i + 1
        const hecho = n < actual
        const esActual = n === actual
        return (
          <li
            key={p}
            aria-current={esActual ? 'step' : undefined}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-pill border px-3 text-cuerpo-sm font-medium whitespace-nowrap',
              hecho && 'border-verde-700 bg-verde-100 font-semibold text-verde-800',
              esActual && 'border-2 border-verde-700 bg-blanco px-[11px] font-semibold text-tinta',
              !hecho && !esActual && 'border-borde-control bg-blanco text-tinta-terciaria',
            )}
          >
            {hecho && <Check size={14} aria-hidden="true" />}
            {n}. {p}
            {hecho && <span className="sr-only"> (hecho)</span>}
          </li>
        )
      })}
    </ol>
  )
}
