import { useId } from 'react'
import { cn } from '@/utils/cn'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  /** Sustantivo del rango: «casos», «alertas», «cuentas». */
  noun: string
  /** Opciones de «Filas por página» (productores: 10/25/50). */
  pageSizeOptions?: number[]
  onPageSizeChange?: (size: number) => void
}

/** Páginas a mostrar: todas si son pocas; si no, primera, vecinas y última con «…». */
function paginasVisibles(actual: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const set = new Set(
    [1, total, actual - 1, actual, actual + 1].filter((p) => p >= 1 && p <= total),
  )
  const ordenadas = [...set].sort((a, b) => a - b)
  const resultado: (number | '…')[] = []
  ordenadas.forEach((p, i) => {
    if (i > 0 && p - ordenadas[i - 1]! > 1) resultado.push('…')
    resultado.push(p)
  })
  return resultado
}

const botonClass =
  'h-8 min-w-8 cursor-pointer rounded-sm border border-borde bg-blanco px-2 text-nota font-semibold text-tinta-secundaria hover:bg-verde-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blanco'

/** Paginación del servidor (pf-pag): «1–15 de 32 casos · 15 por página». */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  noun,
  pageSizeOptions,
  onPageSizeChange,
}: PaginationProps) {
  const selectId = useId()
  const totalPaginas = Math.max(1, Math.ceil(total / pageSize))
  const desde = total === 0 ? 0 : (page - 1) * pageSize + 1
  const hasta = Math.min(page * pageSize, total)

  return (
    <nav aria-label="Paginación" className="flex flex-wrap items-center gap-2 px-4 py-3">
      <span className="flex-1 text-cuerpo-sm text-tinta-terciaria tabular-nums">
        {desde}–{hasta} de {total} {noun} · {pageSize} por página
      </span>
      {pageSizeOptions && onPageSizeChange && (
        <span className="flex items-center gap-2">
          <label htmlFor={selectId} className="text-cuerpo-sm text-tinta-secundaria">
            Filas por página
          </label>
          <select
            id={selectId}
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 rounded-sm border border-borde-control bg-blanco px-2 text-cuerpo-sm"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </span>
      )}
      <button
        type="button"
        className={botonClass}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
      >
        Anterior
      </button>
      {paginasVisibles(page, totalPaginas).map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="px-1 text-tinta-terciaria" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            aria-label={`Página ${p}`}
            className={cn(
              botonClass,
              p === page && 'border-verde-700 bg-verde-700 text-blanco hover:bg-verde-700',
            )}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        className={botonClass}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPaginas}
        aria-label="Página siguiente"
      >
        Siguiente
      </button>
    </nav>
  )
}
