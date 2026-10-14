import { controlClass } from '@/components/ui/Input'
import { ESPECIE_LABEL, VEREDA_LABEL } from '@/locales/es'
import { cn } from '@/utils/cn'
import type { FiltrosConsulta } from '../types'

const opciones = (m: Record<string, string>) =>
  Object.entries(m).map(([value, label]) => ({ value, label }))

const SELECTS: {
  clave: keyof FiltrosConsulta
  etiqueta: string
  todos: string
  opciones: { value: string; label: string }[]
  ancho: string
}[] = [
  {
    clave: 'vereda',
    etiqueta: 'Vereda',
    todos: 'Todas',
    opciones: opciones(VEREDA_LABEL),
    ancho: 'sm:w-40',
  },
  {
    clave: 'especie',
    etiqueta: 'Especie',
    todos: 'Todas',
    opciones: opciones(ESPECIE_LABEL),
    ancho: 'sm:w-40',
  },
  {
    clave: 'estado_casos',
    etiqueta: 'Estado de mis casos',
    todos: 'Todos',
    opciones: [
      { value: 'pendientes', label: 'Con casos pendientes' },
      { value: 'cerrados', label: 'Solo casos cerrados' },
    ],
    ancho: 'sm:w-50',
  },
]

interface ConsultaFiltrosProps {
  filtros: FiltrosConsulta
  onCambiar: (cambios: Partial<FiltrosConsulta>) => void
}

/** Filtros con etiqueta visible (diseño 12d): Vereda · Especie · Estado de mis casos. */
export function ConsultaFiltros({ filtros, onCambiar }: ConsultaFiltrosProps) {
  return (
    <>
      {SELECTS.map((s) => (
        <div key={s.clave} className={cn('flex w-full flex-col gap-1', s.ancho)}>
          <label htmlFor={`cf-${s.clave}`} className="etiqueta">
            {s.etiqueta}
          </label>
          <select
            id={`cf-${s.clave}`}
            value={filtros[s.clave]}
            onChange={(e) => onCambiar({ [s.clave]: e.target.value })}
            className={cn(controlClass, 'h-10 cursor-pointer text-cuerpo-sm')}
          >
            <option value="">{s.todos}</option>
            {s.opciones.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </>
  )
}
