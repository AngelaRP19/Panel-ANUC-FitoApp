import { useRef, useState, type KeyboardEvent } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Camera, ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { TIPO_EVIDENCIA_LABEL, etiqueta } from '@/locales/es'
import type { TipoEvidencia } from '@/types/enums'
import { cn } from '@/utils/cn'
import { formatearFechaHora } from '@/utils/fechas'
import { useEvidencias } from '../hooks'
import type { CasoDetalle } from '../types'
import { TIPOS_GALERIA, textoAlternativo } from '../utils'

const botonOscuro =
  'grid cursor-pointer place-items-center border border-verde-800 bg-verde-900 text-verde-100 hover:bg-verde-800 disabled:cursor-not-allowed disabled:opacity-40'

interface VisorEvidenciasProps {
  caso: CasoDetalle
  /** Tipo con el que se abre (la primera foto de ese tipo). */
  tipoInicial?: TipoEvidencia
  onClose: () => void
}

/**
 * Visor ampliado de evidencias (artboard 04e): ventana oscura a pantalla completa, flechas
 * del teclado para cambiar de foto, Esc para cerrar y foco atrapado (Radix Dialog).
 * Si una URL prefirmada venció (la imagen falla), se piden de nuevo sin recargar la página.
 */
export function VisorEvidencias({ caso, tipoInicial, onClose }: VisorEvidenciasProps) {
  const { data, isPending, refetch } = useEvidencias(caso.id)
  const evidencias = data ?? []
  // null = todavía no se elige: se muestra la primera evidencia del tipo pedido.
  const [elegido, setElegido] = useState<number | null>(null)
  const [zoom, setZoom] = useState(1)
  const renovada = useRef<string | null>(null)

  const inicial = Math.max(0, tipoInicial ? evidencias.findIndex((e) => e.tipo === tipoInicial) : 0)
  const indice = data ? (elegido ?? inicial) : null
  const actual = indice !== null ? evidencias[indice] : undefined
  const ir = (i: number) => {
    if (i < 0 || i >= evidencias.length) return
    setElegido(i)
    setZoom(1)
  }
  const onKeyDown = (e: KeyboardEvent) => {
    if (indice === null) return
    if (e.key === 'ArrowRight') ir(indice + 1)
    if (e.key === 'ArrowLeft') ir(indice - 1)
  }

  const delTipo = actual ? evidencias.filter((e) => e.tipo === actual.tipo) : []
  const contador = actual
    ? `${etiqueta(TIPO_EVIDENCIA_LABEL, actual.tipo)} ${actual.numero} de ${delTipo.length} · evidencia ${indice! + 1} de ${evidencias.length}`
    : ''

  return (
    <Dialog.Root open onOpenChange={(abierto) => !abierto && onClose()}>
      <Dialog.Portal>
        <Dialog.Content
          aria-describedby={undefined}
          onKeyDown={onKeyDown}
          className="fixed inset-0 z-50 flex flex-col bg-verde-950 text-verde-100 focus:outline-none"
        >
          <div className="flex h-16 flex-none flex-wrap items-center gap-4 border-b border-verde-900 px-4 sm:px-6">
            <Dialog.Title className="font-titulos text-lg leading-6 font-semibold text-blanco">
              Caso <span className="font-mono">#{caso.id}</span> · Evidencias fotográficas
            </Dialog.Title>
            <span className="text-cuerpo-sm text-verde-300 tabular-nums" aria-live="polite">
              {contador}
            </span>
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                aria-label="Alejar"
                disabled={zoom <= 1}
                onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
                className={cn(botonOscuro, 'size-10 rounded-md')}
              >
                <ZoomOut size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Acercar"
                disabled={zoom >= 3}
                onClick={() => setZoom((z) => Math.min(3, z + 0.5))}
                className={cn(botonOscuro, 'size-10 rounded-md')}
              >
                <ZoomIn size={18} aria-hidden="true" />
              </button>
              <Dialog.Close
                className={cn(
                  botonOscuro,
                  'flex h-10 gap-2 rounded-md px-3.5 text-cuerpo-sm font-semibold text-blanco',
                )}
              >
                <X size={18} aria-hidden="true" />
                Cerrar visor
              </Dialog.Close>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-6 p-4 sm:flex-row sm:p-6">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <button
                type="button"
                aria-label="Evidencia anterior"
                disabled={!indice}
                onClick={() => ir((indice ?? 0) - 1)}
                className={cn(botonOscuro, 'size-12 flex-none rounded-full')}
              >
                <ChevronLeft size={22} aria-hidden="true" />
              </button>
              <div className="relative flex h-full min-h-60 flex-1 items-center justify-center overflow-hidden rounded-lg border border-verde-800 bg-verde-900">
                {isPending && <Spinner etiqueta="Cargando evidencias" />}
                {actual &&
                  (actual.url ? (
                    <img
                      key={actual.id}
                      src={actual.url}
                      alt={textoAlternativo(actual, caso.id)}
                      style={{ transform: `scale(${zoom})` }}
                      className="max-h-full max-w-full object-contain transition-transform"
                      onError={() => {
                        // URL prefirmada vencida: se renueva una vez por evidencia.
                        if (renovada.current === actual.id) return
                        renovada.current = actual.id
                        void refetch()
                      }}
                    />
                  ) : (
                    <div
                      role="img"
                      aria-label={`${textoAlternativo(actual, caso.id)}: ${actual.descripcion}`}
                      style={{ transform: `scale(${zoom})` }}
                      className="flex flex-col items-center gap-2.5 text-verde-300 transition-transform"
                    >
                      <Camera size={48} strokeWidth={1.5} aria-hidden="true" />
                      <span>{actual.descripcion}</span>
                    </div>
                  ))}
              </div>
              <button
                type="button"
                aria-label="Evidencia siguiente"
                disabled={indice === null || indice >= evidencias.length - 1}
                onClick={() => ir((indice ?? 0) + 1)}
                className={cn(botonOscuro, 'size-12 flex-none rounded-full')}
              >
                <ChevronRight size={22} aria-hidden="true" />
              </button>
            </div>

            <aside
              aria-label="Datos de la evidencia"
              className="flex w-full flex-none flex-col gap-4 rounded-lg bg-verde-900 p-5 sm:w-75"
            >
              <p className="text-xs leading-4 font-semibold tracking-[0.06em] text-verde-300 uppercase">
                Datos de la evidencia
              </p>
              {actual && (
                <dl className="m-0 grid gap-3 text-cuerpo-sm">
                  {[
                    [
                      'Tipo',
                      `${etiqueta(TIPO_EVIDENCIA_LABEL, actual.tipo)} · ${actual.numero} de ${delTipo.length}`,
                    ],
                    ['Recibida por WhatsApp', formatearFechaHora(actual.recibida_en)],
                    ['Enviada por', caso.productor.nombre],
                    ['Pregunta del chatbot', actual.pregunta],
                    ['Texto alternativo', textoAlternativo(actual, caso.id)],
                  ].map(([t, d]) => (
                    <div key={t}>
                      <dt className="text-verde-300">{t}</dt>
                      <dd className="m-0 text-blanco">{d}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <p className="mt-auto rounded-md bg-verde-950 p-3 text-nota">
                Usa las flechas del teclado para cambiar de foto y Esc para cerrar.
              </p>
            </aside>
          </div>

          <div
            role="group"
            aria-label="Miniaturas por tipo"
            className="flex flex-none flex-wrap items-end gap-6 px-4 pb-5 sm:px-6"
          >
            {TIPOS_GALERIA.map((tipo) => {
              const fotos = evidencias.filter((e) => e.tipo === tipo)
              return (
                <div key={tipo}>
                  <p className="mb-1.5 text-xs leading-4 font-semibold tracking-[0.06em] text-verde-300 uppercase">
                    {etiqueta(TIPO_EVIDENCIA_LABEL, tipo)} · {fotos.length}
                  </p>
                  <div className="flex gap-2">
                    {fotos.length === 0 && (
                      <span className="grid h-16.5 w-22 place-items-center rounded-sm border border-dashed border-verde-800 text-xs text-verde-300">
                        Sin fotos
                      </span>
                    )}
                    {fotos.map((e) => {
                      const i = evidencias.indexOf(e)
                      const sel = i === indice
                      return (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => ir(i)}
                          aria-label={`${textoAlternativo(e, caso.id)}: ${e.descripcion}`}
                          aria-current={sel || undefined}
                          className={cn(
                            'h-16.5 w-22 cursor-pointer rounded-sm border border-verde-800 bg-verde-900 hover:bg-verde-800',
                            sel && 'bg-verde-800 outline-2 outline-offset-2 outline-verde-300',
                          )}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
            <div className="ml-auto text-right">
              <p className="font-titulos text-[28px] leading-8 font-bold text-blanco tabular-nums">
                {caso.evidencias_resumen.total}/{caso.evidencias_resumen.maximo}
              </p>
              <p className="text-nota text-verde-300">evidencias útiles</p>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
