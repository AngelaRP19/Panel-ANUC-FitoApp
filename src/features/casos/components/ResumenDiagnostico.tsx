import type { ReactNode } from 'react'
import { ResultadoTecnicoBadge } from '@/components/ui/ResultadoTecnicoBadge'
import { CATEGORIA_LABEL, etiqueta } from '@/locales/es'
import { formatearFechaHora } from '@/utils/fechas'
import type { CasoDetalle } from '../types'

/**
 * «Diagnóstico técnico registrado» (artboard 04c): solo lectura, sin botones de edición ni de
 * reapertura. Se usa en el caso cerrado y, para el líder (que no diagnostica, D-02), en el caso
 * Registrado; `children` agrega la acción de cerrar cuando corresponde.
 */
export function ResumenDiagnostico({
  caso,
  children,
}: {
  caso: CasoDetalle
  children?: ReactNode
}) {
  const d = caso.diagnostico
  const sugerida = caso.preliminar?.resultado === 'PRELIMINAR' ? caso.preliminar.categoria : null
  const detalle = !d
    ? null
    : d.resultado_tecnico === 'CONFIRMADO' && sugerida
      ? etiqueta(CATEGORIA_LABEL, sugerida)
      : d.categoria_determinada
        ? etiqueta(CATEGORIA_LABEL, d.categoria_determinada)
        : null

  return (
    <section
      aria-labelledby="t-diag"
      className="rounded-lg border border-verde-300 bg-blanco shadow-1"
    >
      <div className="px-6 pt-5">
        <p className="sobretitulo">Resultado técnico · decisión humana</p>
        <h2 id="t-diag" className="mt-1 titulo-h2">
          Diagnóstico técnico registrado
        </h2>
      </div>
      {d ? (
        <div className="flex flex-col gap-4 px-6 pt-4 pb-6">
          <div>
            <ResultadoTecnicoBadge resultado={d.resultado_tecnico} detalle={detalle} />
          </div>
          <dl className="m-0 flex flex-col gap-1 text-cuerpo-sm">
            {d.motivo_visita && (
              <>
                <dt className="text-tinta-secundaria">Motivo de la visita</dt>
                <dd className="m-0 mb-2">{d.motivo_visita}</dd>
              </>
            )}
            <dt className="text-tinta-secundaria">Descripción</dt>
            <dd className="m-0 mb-2">{d.descripcion || '—'}</dd>
            <dt className="text-tinta-secundaria">Observaciones</dt>
            <dd className="m-0 mb-2">{d.observaciones || '—'}</dd>
            <dt className="text-tinta-secundaria">Técnico responsable</dt>
            <dd className="m-0 font-medium">
              {d.tecnico_responsable.nombre} ·{' '}
              <span className="font-normal text-tinta-terciaria tabular-nums">
                {formatearFechaHora(d.registrado_en)}
              </span>
            </dd>
          </dl>
        </div>
      ) : (
        <p className="px-6 pt-4 pb-6 text-cuerpo-sm text-tinta-terciaria">
          Este caso se cerró sin un diagnóstico registrado en el panel.
        </p>
      )}
      {children}
    </section>
  )
}
