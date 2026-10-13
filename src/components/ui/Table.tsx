import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Skeleton } from './Skeleton'

export interface Column<T> {
  key: string
  /** Texto del encabezado (puede llevar un icono, p. ej. el de orden). */
  header: ReactNode
  render: (row: T) => ReactNode
  /** Ancho de la columna (CSS), p. ej. '96px' o '20%'. */
  width?: string
  className?: string
  /** Ancho del esqueleto de carga de la celda. */
  skeletonWidth?: string
}

interface TableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  /** Nombre accesible de la tabla («Casos de la bandeja»). */
  label: string
  /** Abre el resumen o la ficha de la fila. Agrega una columna con un botón real para teclado. */
  onRowOpen?: (row: T) => void
  /** Nombre del botón de la fila («Caso #0227, Pedro Suárez, 8 días en espera. Ver resumen»). */
  rowLabel?: (row: T) => string
  selectedKey?: string | null
  /** Muestra filas esqueleto y anuncia «Cargando …». */
  loading?: boolean
  loadingLabel?: string
  skeletonRows?: number
  /** Contenido cuando no hay filas (EmptyState). */
  empty?: ReactNode
}

/**
 * Tabla de datos (af-tabla / pf-t): encabezados en sobretítulo sobre verde-50, filas de 48 px,
 * hover verde-100 y fila seleccionada verde-200. Toda la fila abre el detalle con el ratón y
 * cada fila tiene además un botón real para el teclado.
 */
export function Table<T>({
  columns,
  rows,
  rowKey,
  label,
  onRowOpen,
  rowLabel,
  selectedKey,
  loading = false,
  loadingLabel = 'Cargando',
  skeletonRows = 5,
  empty,
}: TableProps<T>) {
  const conAccion = !!onRowOpen
  const sinFilas = !loading && rows.length === 0

  return (
    <div className="overflow-x-auto" aria-busy={loading || undefined}>
      {loading && (
        <span role="status" className="sr-only">
          {loadingLabel}
        </span>
      )}
      <table aria-label={label} className="w-full border-collapse bg-blanco text-cuerpo-sm">
        <colgroup>
          {columns.map((c) => (
            <col key={c.key} style={c.width ? { width: c.width } : undefined} />
          ))}
          {conAccion && <col style={{ width: '48px' }} />}
        </colgroup>
        <thead>
          <tr className="bg-verde-50">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className="h-10 border-b border-borde px-3 text-left sobretitulo whitespace-nowrap first:pl-6"
              >
                {c.header}
              </th>
            ))}
            {conAccion && (
              <th scope="col" className="border-b border-borde">
                <span className="sr-only">Acciones</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: skeletonRows }, (_, i) => (
              <tr key={i} aria-hidden="true" className="h-12 border-b border-borde">
                {columns.map((c) => (
                  <td key={c.key} className="px-3 first:pl-6">
                    <Skeleton style={{ width: c.skeletonWidth ?? '70%', height: 14 }} />
                  </td>
                ))}
                {conAccion && <td />}
              </tr>
            ))}
          {!loading &&
            rows.map((row) => {
              const key = rowKey(row)
              return (
                <tr
                  key={key}
                  onClick={onRowOpen ? () => onRowOpen(row) : undefined}
                  className={cn(
                    'h-12 border-b border-borde tabular-nums',
                    onRowOpen && 'cursor-pointer',
                    selectedKey === key ? 'bg-verde-200' : 'hover:bg-verde-100',
                  )}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn('max-w-0 truncate px-3 py-2.5 first:pl-6', c.className)}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                  {onRowOpen && (
                    <td className="pr-3 text-right">
                      <button
                        type="button"
                        aria-label={rowLabel ? rowLabel(row) : 'Ver detalle'}
                        onClick={(e) => {
                          e.stopPropagation()
                          onRowOpen(row)
                        }}
                        className="inline-grid size-8 cursor-pointer place-items-center rounded-sm text-tinta-terciaria hover:bg-verde-50 hover:text-verde-700"
                      >
                        <ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" />
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
        </tbody>
      </table>
      {sinFilas && empty}
    </div>
  )
}
