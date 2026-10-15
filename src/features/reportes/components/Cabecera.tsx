import { useState } from 'react'
import { Link } from 'react-router'
import { CalendarDays, Download, FileDown, SlidersHorizontal } from 'lucide-react'
import { Button, buttonClass } from '@/components/ui/Button'
import { FilterChip } from '@/components/ui/Chip'
import { toast } from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { MENSAJES } from '@/locales/es'
import { cn } from '@/utils/cn'
import { textoGenerado, type DocumentoExportable } from '../exportar'
import { useExportarCsv, usePrepararPdf } from '../hooks'
import { DocumentoImpresion } from './DocumentoImpresion'
import type { FiltrosReporte, PanelFiltros, TarjetaReporte, TipoReporte } from '../types'
import { filtrosActivos, PANELES, REPORTES, textoPeriodo, urlReporte } from '../utils'

/**
 * «Exportar CSV» (descarga directa, lista para Excel) y «Descargar PDF» (abre la impresión con
 * el formato del reporte; en el diálogo se elige «Guardar como PDF»).
 */
export function BotonesExportar({
  tipo,
  filtros,
}: {
  tipo: TipoReporte | 'resumen'
  filtros: FiltrosReporte
}) {
  const { usuario } = useAuth()
  const csv = useExportarCsv()
  const pdf = usePrepararPdf()
  const [imprimir, setImprimir] = useState<{ doc: DocumentoExportable; generado: string } | null>(
    null,
  )
  const error = () => toast.error('No se pudo preparar el archivo', MENSAJES.errorConexionTexto)
  const autor = usuario
    ? `${usuario.nombre} · ${usuario.rol === 'LIDER_TECNICO' ? 'líder técnico' : 'técnico'}`
    : 'Panel fitosanitario'
  return (
    <>
      <Button
        variant="secondary"
        loading={csv.isPending}
        onClick={() =>
          csv.mutate(
            { tipo, filtros },
            {
              onSuccess: () => toast.exito('CSV descargado', 'Con los filtros aplicados.'),
              onError: error,
            },
          )
        }
      >
        <Download aria-hidden="true" />
        Exportar CSV
      </Button>
      <Button
        loading={pdf.isPending || !!imprimir}
        onClick={() =>
          pdf.mutate(
            { tipo, filtros },
            {
              onSuccess: (doc) => setImprimir({ doc, generado: textoGenerado() }),
              onError: error,
            },
          )
        }
      >
        <FileDown aria-hidden="true" />
        Descargar PDF
      </Button>
      {imprimir && (
        <DocumentoImpresion
          documento={imprimir.doc}
          generado={imprimir.generado}
          autor={autor}
          onTerminar={() => setImprimir(null)}
        />
      )}
    </>
  )
}

/** «Filtros aplicados»: periodo, filtros quitables, panel que se usa y botón «Filtros». */
export function FiltrosAplicados({
  filtros,
  panel,
  onQuitar,
  onAbrir,
  nombres,
}: {
  filtros: FiltrosReporte
  panel: PanelFiltros
  onQuitar: (clave: string) => void
  onAbrir: () => void
  /** Nombres legibles de valores con id («tecnico:u-ana» → «Ana Lucía Becerra»). */
  nombres?: Record<string, string>
}) {
  const activos = filtrosActivos(filtros, nombres)
  const meta = PANELES[panel]
  return (
    <div
      role="group"
      aria-label="Filtros aplicados"
      className="flex flex-wrap items-center gap-2.5 rounded-lg border border-borde bg-blanco px-4 py-3 shadow-1"
    >
      <span className="inline-flex h-7 items-center gap-1.5 rounded-pill border border-borde-control bg-blanco px-2.5 text-nota">
        <CalendarDays size={14} aria-hidden="true" />
        <b className="font-semibold">Periodo:</b>
        <span className="tabular-nums">{textoPeriodo(filtros)}</span>
      </span>
      {activos.map((a) => (
        <FilterChip
          key={a.clave}
          onRemove={() => onQuitar(a.clave)}
          removeLabel={`Quitar filtro ${a.texto}`}
        >
          {a.texto}
        </FilterChip>
      ))}
      <span className="ml-auto text-cuerpo-sm text-tinta-terciaria">
        Panel de filtros: {meta.codigo} · {meta.titulo.toLowerCase()}
      </span>
      <Button
        variant="secondary"
        size="sm"
        onClick={onAbrir}
        aria-label={activos.length ? `Filtros, ${activos.length} activos` : 'Filtros'}
      >
        <SlidersHorizontal aria-hidden="true" />
        Filtros
        {activos.length > 0 && (
          <span className="inline-grid h-4.5 min-w-4.5 place-items-center rounded-full bg-verde-700 px-1.25 text-[11px] leading-none font-semibold text-blanco">
            {activos.length}
          </span>
        )}
      </Button>
    </div>
  )
}

/** Tarjetas de los cinco reportes del índice (R0) con sus cifras destacadas. */
export function TarjetasReportes({
  reportes,
  filtros,
}: {
  reportes: TarjetaReporte[]
  filtros: FiltrosReporte
}) {
  return (
    <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3">
      {reportes.map((r) => {
        const meta = REPORTES[r.tipo]
        const panel = PANELES[meta.panel]
        // Solo el periodo pasa al reporte: cada uno tiene su propio panel de filtros.
        const periodo = {
          periodo: filtros.periodo ?? '',
          desde: filtros.desde ?? '',
          hasta: filtros.hasta ?? '',
        }
        return (
          <li key={r.tipo}>
            <article
              aria-labelledby={`r-${r.tipo}`}
              className="flex h-full flex-col gap-2.5 rounded-lg border border-borde bg-blanco px-5 py-4.5 shadow-1"
            >
              <h2 id={`r-${r.tipo}`} className="titulo-h3">
                {r.titulo}
              </h2>
              <p className="text-cuerpo-sm text-tinta-secundaria">{r.descripcion}</p>
              <ul className="m-0 flex flex-wrap gap-x-4 gap-y-1 p-0 text-cuerpo-sm">
                {r.destacados.map((d) => (
                  <li key={d} className="list-none font-semibold tabular-nums">
                    {d}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex items-center gap-2 pt-1">
                <span className="flex-1 text-nota text-tinta-terciaria">
                  {meta.codigo} · {panel.titulo.toLowerCase()}
                </span>
                <Link
                  to={urlReporte(r.tipo, periodo)}
                  className={cn(buttonClass('secondary', 'sm'))}
                  aria-label={`Ver reporte ${r.titulo}`}
                >
                  Ver reporte
                </Link>
              </div>
            </article>
          </li>
        )
      })}
    </ul>
  )
}
