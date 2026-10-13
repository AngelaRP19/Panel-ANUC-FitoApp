import { useState } from 'react'
import { ArrowLeftRight, Check, CircleHelp, Info, Loader, X } from 'lucide-react'
import { Aviso } from '@/components/ui/Aviso'
import { BarraCoincidencia } from '@/components/ui/BarraCoincidencia'
import { Button } from '@/components/ui/Button'
import { CategoriaMarca, FormaCategoria } from '@/components/ui/CategoriaMarca'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { CATEGORIA_LABEL, MENSAJES, etiqueta } from '@/locales/es'
import { formatearPorcentaje } from '@/utils/numeros'
import { useExplicacion } from '../hooks'
import type { CasoDetalle } from '../types'

/** Ventana «Por qué se sugiere esta categoría» / «Por qué no se identificó». */
function ExplicacionDialog({ caso, onClose }: { caso: CasoDetalle; onClose: () => void }) {
  const { data, isPending, isError, refetch } = useExplicacion(caso.id)
  const p = caso.preliminar!
  const noIdentificada = p.resultado === 'NO_IDENTIFICADO'
  const sobre = noIdentificada
    ? 'Identificación preliminar · no identificada'
    : `Identificación preliminar · ${etiqueta(CATEGORIA_LABEL, p.categoria)} ${formatearPorcentaje(p.porcentaje)}`

  return (
    <Modal
      open
      onClose={onClose}
      position="top"
      title={
        <>
          <span className="mb-1 block sobretitulo">{sobre}</span>
          {noIdentificada ? 'Por qué no se identificó' : 'Por qué se sugiere esta categoría'}
        </>
      }
    >
      {isPending && <Skeleton style={{ height: 120 }} />}
      {isError && (
        <Aviso tono="peligro" titulo="No se pudo cargar la explicación.">
          <Button variant="text" size="sm" onClick={() => refetch()}>
            {MENSAJES.reintentar}
          </Button>
        </Aviso>
      )}
      {data && noIdentificada && (
        <>
          <p className="etiqueta">{MENSAJES.porcentajeCoincidencia} · categorías más cercanas</p>
          <div className="flex flex-col gap-2">
            {data.cercanas.map((c) => (
              <BarraCoincidencia
                key={c.categoria}
                categoria={c.categoria}
                porcentaje={c.porcentaje}
                alterna
                className="grid-cols-[180px_1fr_56px]"
              />
            ))}
          </div>
          {data.texto && <p className="text-cuerpo-sm">{data.texto}</p>}
        </>
      )}
      {data && !noIdentificada && (
        <>
          <ul className="flex flex-col gap-2.5 text-cuerpo-sm">
            {data.coincide.map((t) => (
              <li key={t} className="flex gap-2">
                <Check size={16} className="mt-0.5 flex-none text-verde-700" aria-hidden="true" />
                <span>
                  <b className="font-semibold">Coincide:</b> {t}
                </span>
              </li>
            ))}
            {data.descarta.map((d) => (
              <li key={d.categoria} className="flex gap-2">
                <X size={16} className="mt-0.5 flex-none text-tinta-terciaria" aria-hidden="true" />
                <span>
                  <b className="font-semibold">
                    Descarta {etiqueta(CATEGORIA_LABEL, d.categoria)}:
                  </b>{' '}
                  {d.texto}
                </span>
              </li>
            ))}
          </ul>
          {data.cercanas.length > 0 && (
            <p className="text-nota text-tinta-terciaria">
              Por debajo del mínimo para sugerirse:{' '}
              {data.cercanas
                .map(
                  (c) =>
                    `${etiqueta(CATEGORIA_LABEL, c.categoria)} ${formatearPorcentaje(c.porcentaje)}`,
                )
                .join(' · ')}
              .
            </p>
          )}
          <Aviso tono="info" titulo={MENSAJES.avisoPreliminar}>
            {data.texto && (
              <>
                <br />
                {data.texto}
              </>
            )}
          </Aviso>
        </>
      )}
    </Modal>
  )
}

/** Aviso fijo + botón «Ver explicación». */
function AvisoPreliminar({ onExplicar }: { onExplicar?: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Aviso tono="info" titulo={MENSAJES.avisoPreliminar} className="flex-1 px-3 py-2.5" />
      {onExplicar && (
        <Button variant="secondary" size="sm" onClick={onExplicar}>
          Ver explicación
        </Button>
      )}
    </div>
  )
}

/**
 * «Identificación preliminar · automática» (artboards 04, 04b, 04c): siempre separado del
 * resultado técnico y con el aviso de que la decisión corresponde al técnico.
 */
export function ResultadoPreliminar({ caso }: { caso: CasoDetalle }) {
  const [explicar, setExplicar] = useState(false)
  const p = caso.preliminar
  const ambigua = p?.resultado === 'AMBIGUO' && p.alternativa

  return (
    <section
      aria-labelledby="t-pre"
      className="rounded-lg border border-dashed border-borde-control bg-blanco"
    >
      <div className="flex items-start gap-3 px-6 pt-5">
        <div className="flex-1">
          <p className="sobretitulo">Identificación preliminar · automática</p>
          <h2 id="t-pre" className="mt-1 titulo-h2">
            Resultado del análisis preliminar
          </h2>
        </div>
        {ambigua && (
          <span className="inline-flex h-6 items-center gap-1.5 rounded-sm border border-advertencia bg-advertencia-suave px-2 text-xs leading-4 font-semibold text-advertencia">
            <ArrowLeftRight size={14} aria-hidden="true" />
            Ambigua · 2 categorías
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4 px-6 pt-4 pb-6">
        {!p && (
          <div className="flex items-center gap-3">
            <span className="grid size-10 flex-none place-items-center rounded-md bg-info-suave text-info">
              <Loader size={22} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div>
              <p className="titulo-h3">El chatbot aún no termina el análisis</p>
              <p className="text-cuerpo-sm text-tinta-terciaria">
                La identificación preliminar aparece cuando el productor termina el cuestionario.
              </p>
            </div>
          </div>
        )}

        {p?.resultado === 'PRELIMINAR' && p.categoria && (
          <>
            <div className="flex items-center gap-3">
              <FormaCategoria categoria={p.categoria} tamano={16} />
              <p className="flex-none titulo-h3">{etiqueta(CATEGORIA_LABEL, p.categoria)}</p>
              <div
                role="img"
                aria-label={`${etiqueta(CATEGORIA_LABEL, p.categoria)}: ${formatearPorcentaje(p.porcentaje)} de coincidencia de síntomas`}
                className="grid flex-1 grid-cols-[1fr_56px] items-center gap-3"
              >
                <span className="h-2.5 overflow-hidden rounded-pill bg-verde-100">
                  <span
                    className="block h-full rounded-pill bg-verde-600"
                    style={{ width: `${p.porcentaje ?? 0}%` }}
                  />
                </span>
                <span className="text-right font-semibold tabular-nums">
                  {formatearPorcentaje(p.porcentaje)}
                </span>
              </div>
            </div>
            {caso.preliminar_resumen && (
              <p className="text-cuerpo-sm text-tinta-secundaria">{caso.preliminar_resumen}</p>
            )}
            <AvisoPreliminar onExplicar={() => setExplicar(true)} />
          </>
        )}

        {ambigua && p.categoria && (
          <>
            {caso.preliminar_resumen && <p>{caso.preliminar_resumen}</p>}
            <div className="flex flex-col gap-3">
              <p className="etiqueta">{MENSAJES.porcentajeCoincidencia}</p>
              <BarraCoincidencia
                categoria={p.categoria}
                porcentaje={p.porcentaje ?? 0}
                className="grid-cols-[140px_1fr_56px]"
              />
              <BarraCoincidencia
                categoria={p.alternativa!.categoria}
                porcentaje={p.alternativa!.porcentaje}
                alterna
                className="grid-cols-[140px_1fr_56px]"
              />
            </div>
            {caso.preliminar_coincidencias.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {caso.preliminar_coincidencias.map((c) => (
                  <div key={c.categoria} className="rounded-md border border-borde px-3.5 py-3">
                    <p className="font-semibold">
                      <CategoriaMarca categoria={c.categoria} className="font-semibold" /> coincide
                      en
                    </p>
                    <p className="mt-1.5 text-cuerpo-sm text-tinta-secundaria">{c.texto}</p>
                  </div>
                ))}
              </div>
            )}
            <Aviso tono="info" titulo={MENSAJES.avisoPreliminar} icono={Info}>
              {caso.preliminar_pista && (
                <>
                  <br />
                  {caso.preliminar_pista}
                </>
              )}
            </Aviso>
          </>
        )}

        {p?.resultado === 'NO_IDENTIFICADO' && (
          <>
            <div className="flex items-center gap-3">
              <span className="grid size-10 flex-none place-items-center rounded-md bg-neutro-suave text-neutro">
                <CircleHelp size={22} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div>
                <p className="titulo-h3">No identificada</p>
                {caso.preliminar_resumen && (
                  <p className="text-cuerpo-sm text-tinta-terciaria">{caso.preliminar_resumen}</p>
                )}
              </div>
            </div>
            <AvisoPreliminar onExplicar={() => setExplicar(true)} />
          </>
        )}
      </div>

      {explicar && p && <ExplicacionDialog caso={caso} onClose={() => setExplicar(false)} />}
    </section>
  )
}
