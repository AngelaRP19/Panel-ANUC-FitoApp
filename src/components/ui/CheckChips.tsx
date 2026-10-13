import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

interface CheckChipsProps {
  /** Leyenda del grupo («Especies de «Invernadero norte»»). */
  legend: string
  required?: boolean
  opciones: { value: string; label: string }[]
  valores: string[]
  onChange: (valores: string[]) => void
  error?: string
  /** Valores marcados con borde de advertencia (p. ej. una especie en uso que se quitó). */
  resaltados?: string[]
  /** Contenido debajo de las casillas (avisos). */
  idDescripcion?: string
  children?: ReactNode
}

/**
 * Grupo de casillas con aspecto de chip (pf-chip con checkbox): fieldset + legend, casillas
 * nativas y error asociado. Se usa para elegir las especies de un cultivo.
 */
export function CheckChips({
  legend,
  required,
  opciones,
  valores,
  onChange,
  error,
  resaltados = [],
  idDescripcion,
  children,
}: CheckChipsProps) {
  const alternar = (v: string) =>
    onChange(valores.includes(v) ? valores.filter((x) => x !== v) : [...valores, v])
  const idError = error ? `${idDescripcion ?? legend}-error`.replace(/\s+/g, '-') : undefined

  return (
    <fieldset
      aria-describedby={[idError, idDescripcion].filter(Boolean).join(' ') || undefined}
      className="m-0 flex flex-col gap-2.5 rounded-md border border-borde px-3.5 pt-1 pb-3"
    >
      <legend className="px-1 etiqueta">
        {legend}
        {required && (
          <span className="text-peligro" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </legend>
      <div className="flex flex-wrap gap-2">
        {opciones.map((o) => {
          const marcado = valores.includes(o.value)
          return (
            <label
              key={o.value}
              className={cn(
                'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-pill border px-3 text-cuerpo-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-verde-600',
                marcado
                  ? 'border-verde-700 bg-verde-100 font-semibold text-verde-800'
                  : 'border-borde-control bg-blanco text-tinta',
                resaltados.includes(o.value) && 'border-advertencia',
              )}
            >
              <input
                type="checkbox"
                checked={marcado}
                onChange={() => alternar(o.value)}
                className="m-0 accent-verde-700 focus-visible:outline-none"
              />
              {o.label}
            </label>
          )
        })}
      </div>
      {error && (
        <span
          id={idError}
          role="alert"
          className="flex items-start gap-1.5 text-nota font-medium text-peligro"
        >
          <AlertCircle size={16} className="mt-px shrink-0" aria-hidden="true" />
          {error}
        </span>
      )}
      {children}
    </fieldset>
  )
}
