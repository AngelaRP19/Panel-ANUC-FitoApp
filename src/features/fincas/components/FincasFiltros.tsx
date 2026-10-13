import { controlClass } from '@/components/ui/Input'
import { ESPECIE_LABEL, TIPO_CULTIVO_LABEL, VEREDA_LABEL } from '@/locales/es'
import { cn } from '@/utils/cn'
import type { FiltrosFincas } from '../types'

const opciones = (m: Record<string, string>) =>
  Object.entries(m).map(([value, label]) => ({ value, label }))

const SELECTS: {
  clave: keyof FiltrosFincas
  etiqueta: string
  todos: string
  opciones: { value: string; label: string }[]
  ancho: string
}[] = [
  {
    clave: 'vereda',
    etiqueta: 'Vereda',
    todos: 'Todas las veredas',
    opciones: opciones(VEREDA_LABEL),
    ancho: 'sm:w-42.5',
  },
  {
    clave: 'especie',
    etiqueta: 'Especie',
    todos: 'Todas las especies',
    opciones: opciones(ESPECIE_LABEL),
    ancho: 'sm:w-40',
  },
  {
    clave: 'tipo',
    etiqueta: 'Tipo de cultivo',
    todos: 'Invernadero y campo',
    opciones: opciones(TIPO_CULTIVO_LABEL),
    ancho: 'sm:w-42.5',
  },
  {
    clave: 'casos',
    etiqueta: 'Casos',
    todos: 'Con o sin casos',
    opciones: [
      { value: 'con', label: 'Con casos activos' },
      { value: 'sin', label: 'Sin casos activos' },
    ],
    ancho: 'sm:w-42.5',
  },
]

interface FincasFiltrosProps {
  filtros: FiltrosFincas
  onCambiar: (cambios: Partial<FiltrosFincas>) => void
}

/** Filtros de fincas en línea (artboard 09): vereda, especie, tipo de cultivo y casos activos. */
export function FincasFiltros({ filtros, onCambiar }: FincasFiltrosProps) {
  return (
    <>
      {SELECTS.map((s) => (
        <select
          key={s.clave}
          aria-label={s.etiqueta}
          value={filtros[s.clave]}
          onChange={(e) => onCambiar({ [s.clave]: e.target.value })}
          className={cn(controlClass, 'h-10 w-full cursor-pointer text-cuerpo-sm', s.ancho)}
        >
          <option value="">{s.todos}</option>
          {s.opciones.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
    </>
  )
}
