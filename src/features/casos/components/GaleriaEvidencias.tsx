import { useState } from 'react'
import { Camera } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TIPO_EVIDENCIA_LABEL, etiqueta } from '@/locales/es'
import type { TipoEvidencia } from '@/types/enums'
import type { CasoDetalle } from '../types'
import { TIPOS_GALERIA } from '../utils'
import { VisorEvidencias } from './VisorEvidencias'

/**
 * Evidencias fotográficas del caso (artboard 04): conteo útil (8/12), un recuadro por tipo con
 * su número de fotos («Sin fotos» si no hay) y «Ver todas». Cada recuadro abre el visor.
 */
export function GaleriaEvidencias({ caso }: { caso: CasoDetalle }) {
  const [visor, setVisor] = useState<{ tipo?: TipoEvidencia } | null>(null)
  const { total, maximo, por_tipo } = caso.evidencias_resumen

  return (
    <section
      aria-labelledby="t-evid"
      className="rounded-lg border border-borde bg-blanco px-6 pt-5 pb-6 shadow-1"
    >
      <div className="mb-3.5 flex items-center gap-3">
        <h2 id="t-evid" className="flex-1 titulo-h2">
          Evidencias fotográficas
        </h2>
        <span className="font-titulos text-[22px] leading-7 font-bold tabular-nums">
          {total}/{maximo}
          <span className="sr-only"> evidencias útiles</span>
        </span>
        <Button variant="secondary" size="sm" disabled={total === 0} onClick={() => setVisor({})}>
          Ver todas
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TIPOS_GALERIA.map((tipo) => {
          const n = por_tipo[tipo] ?? 0
          const nombre = etiqueta(TIPO_EVIDENCIA_LABEL, tipo)
          if (n === 0) {
            return (
              <div
                key={tipo}
                className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-borde-control bg-blanco p-2 text-center text-tinta-terciaria"
              >
                <span className="text-[11px] leading-4 font-semibold tracking-[0.06em] uppercase">
                  {nombre}
                </span>
                <span className="text-xs leading-4 font-medium">Sin fotos</span>
              </div>
            )
          }
          return (
            <button
              key={tipo}
              type="button"
              onClick={() => setVisor({ tipo })}
              aria-label={`Ver ${n} ${n === 1 ? 'evidencia' : 'evidencias'} de ${nombre.toLowerCase()} del caso #${caso.id}`}
              className="relative flex aspect-[4/3] cursor-zoom-in flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border border-borde bg-verde-100 p-2 text-verde-800 hover:border-verde-300"
            >
              <span className="absolute top-2 left-2 rounded-sm border border-borde bg-blanco px-1.5 text-[11px] leading-4 font-semibold text-tinta-secundaria">
                {n}
              </span>
              <Camera size={22} strokeWidth={1.75} aria-hidden="true" />
              <span className="text-[11px] leading-4 font-semibold tracking-[0.06em] text-tinta-secundaria uppercase">
                {nombre}
              </span>
            </button>
          )
        })}
      </div>

      {visor && (
        <VisorEvidencias caso={caso} tipoInicial={visor.tipo} onClose={() => setVisor(null)} />
      )}
    </section>
  )
}
