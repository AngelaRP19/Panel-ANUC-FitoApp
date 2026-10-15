import { useState, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FilterChip } from '@/components/ui/Chip'
import { EntradaFecha } from '@/components/ui/EntradaFecha'
import { controlClass } from '@/components/ui/Input'
import { ESPECIE_LABEL, MENSAJES, VEREDA_LABEL, etiqueta } from '@/locales/es'
import { cn } from '@/utils/cn'
import { formatearFechaEntrada, parsearFechaEntrada } from '@/utils/fechas'
import type { FiltrosProductores } from '../types'
import { CLAVES_FILTRO_PRODUCTORES, type ClavePanel } from '../utils'

const ESTADOS = [
  { value: 'activo', label: 'Activo' },
  { value: 'deshabilitado', label: 'Deshabilitado' },
]
const CASOS = [
  { value: 'con', label: 'Con casos activos' },
  { value: 'sin', label: 'Sin casos activos' },
]
const CONSULTA = [
  { value: '30', label: 'Consultó en los últimos 30 días' },
  { value: '90', label: 'Sin consultas en 90 días' },
]
const VEREDAS = Object.entries(VEREDA_LABEL)
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label))
const ESPECIES = Object.entries(ESPECIE_LABEL).map(([value, label]) => ({ value, label }))

function Campo({
  id,
  label,
  children,
  error,
}: {
  id: string
  label: ReactNode
  children: ReactNode
  error?: string
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-xs leading-4 font-semibold text-tinta-secundaria">
        {label}
      </label>
      {children}
      {error && (
        <span id={`${id}-error`} role="alert" className="flex gap-1 text-nota text-peligro">
          <AlertCircle size={14} className="mt-0.5 flex-none" aria-hidden="true" />
          {error}
        </span>
      )}
    </div>
  )
}

function Opciones({
  id,
  value,
  onChange,
  todos,
  opciones,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  todos: string
  opciones: { value: string; label: string }[]
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(controlClass, 'h-9 cursor-pointer text-cuerpo-sm')}
    >
      <option value="">{todos}</option>
      {opciones.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

interface ProductoresFiltrosProps {
  filtros: FiltrosProductores
  onCambiar: (cambios: Partial<FiltrosProductores>) => void
}

/**
 * Panel de filtros de productores (artboard 08, pf-panel-filtros): se aplican al cambiar.
 * La finca y las fechas se aplican al salir del campo (las fechas solo si son válidas).
 */
export function ProductoresFiltros({ filtros, onCambiar }: ProductoresFiltrosProps) {
  const [finca, setFinca] = useState(filtros.finca)
  const [fechas, setFechas] = useState({
    desde: formatearFechaEntrada(filtros.desde),
    hasta: formatearFechaEntrada(filtros.hasta),
  })
  const [errores, setErrores] = useState<{ desde?: string; hasta?: string }>({})

  const aplicarFecha = (k: 'desde' | 'hasta') => {
    const texto = fechas[k].trim()
    if (!texto) {
      setErrores((e) => ({ ...e, [k]: undefined }))
      return onCambiar({ [k]: '' })
    }
    const fecha = parsearFechaEntrada(texto)
    if (!fecha) return setErrores((e) => ({ ...e, [k]: 'Escribe la fecha como dd/mm/aaaa' }))
    setErrores((e) => ({ ...e, [k]: undefined }))
    onCambiar({ [k]: fecha })
  }

  return (
    <div
      id="p-filtros"
      role="group"
      aria-label="Filtros de productores"
      className="grid grid-cols-1 gap-x-4 gap-y-3 border-b border-borde bg-verde-50 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <Campo id="pf-estado" label="Estado del productor">
        <Opciones
          id="pf-estado"
          value={filtros.estado}
          onChange={(estado) => onCambiar({ estado })}
          todos="Todos"
          opciones={ESTADOS}
        />
      </Campo>
      <Campo id="pf-vereda" label="Vereda">
        <Opciones
          id="pf-vereda"
          value={filtros.vereda}
          onChange={(vereda) => onCambiar({ vereda })}
          todos="Todas"
          opciones={VEREDAS}
        />
      </Campo>
      <Campo id="pf-especie" label="Especie cultivada">
        <Opciones
          id="pf-especie"
          value={filtros.especie}
          onChange={(especie) => onCambiar({ especie })}
          todos="Todas"
          opciones={ESPECIES}
        />
      </Campo>
      <Campo id="pf-casos" label="Casos activos">
        <Opciones
          id="pf-casos"
          value={filtros.casos}
          onChange={(casos) => onCambiar({ casos })}
          todos="Con o sin casos"
          opciones={CASOS}
        />
      </Campo>
      <Campo id="pf-finca" label="Finca">
        <input
          id="pf-finca"
          value={finca}
          placeholder="Nombre de la finca"
          onChange={(e) => setFinca(e.target.value)}
          onBlur={() => onCambiar({ finca: finca.trim() })}
          onKeyDown={(e) => e.key === 'Enter' && onCambiar({ finca: finca.trim() })}
          className={cn(controlClass, 'h-9 text-cuerpo-sm')}
        />
      </Campo>
      {(['desde', 'hasta'] as const).map((k) => (
        <Campo
          key={k}
          id={`pf-${k}`}
          error={errores[k]}
          label={
            <>
              Registrado {k} <span className="font-normal text-tinta-terciaria">(dd/mm/aaaa)</span>
            </>
          }
        >
          <EntradaFecha
            id={`pf-${k}`}
            value={fechas[k]}
            onChange={(e) => setFechas((f) => ({ ...f, [k]: e.target.value }))}
            onBlur={() => aplicarFecha(k)}
            onKeyDown={(e) => e.key === 'Enter' && aplicarFecha(k)}
            onElegirFecha={(fecha) => {
              setFechas((f) => ({ ...f, [k]: formatearFechaEntrada(fecha) }))
              setErrores((e) => ({ ...e, [k]: undefined }))
              onCambiar({ [k]: fecha })
            }}
            invalid={!!errores[k]}
            aria-describedby={errores[k] ? `pf-${k}-error` : undefined}
            className="h-9 text-cuerpo-sm"
          />
        </Campo>
      ))}
      <Campo id="pf-consulta" label="Consulta por WhatsApp">
        <Opciones
          id="pf-consulta"
          value={filtros.consulta}
          onChange={(consulta) => onCambiar({ consulta })}
          todos="Cualquiera"
          opciones={CONSULTA}
        />
      </Campo>
    </div>
  )
}

interface FiltrosActivosProductoresProps {
  filtros: FiltrosProductores
  onQuitar: (clave: ClavePanel | 'q') => void
  onLimpiar: () => void
}

/** Chips de los filtros aplicados y «Limpiar filtros». */
export function FiltrosActivosProductores({
  filtros,
  onQuitar,
  onLimpiar,
}: FiltrosActivosProductoresProps) {
  const etiquetas: Record<ClavePanel | 'q', (v: string) => string> = {
    q: (v) => `Búsqueda: ${v}`,
    estado: (v) => `Estado: ${ESTADOS.find((x) => x.value === v)?.label ?? v}`,
    vereda: (v) => `Vereda: ${etiqueta(VEREDA_LABEL, v, v)}`,
    especie: (v) => `Especie: ${etiqueta(ESPECIE_LABEL, v, v)}`,
    casos: (v) => CASOS.find((x) => x.value === v)?.label ?? v,
    finca: (v) => `Finca: ${v}`,
    desde: (v) => `Registrado desde ${formatearFechaEntrada(v)}`,
    hasta: (v) => `Registrado hasta ${formatearFechaEntrada(v)}`,
    consulta: (v) => CONSULTA.find((x) => x.value === v)?.label ?? v,
  }
  const activos = (['q', ...CLAVES_FILTRO_PRODUCTORES] as const).filter((k) => filtros[k])
  if (activos.length === 0) return null
  return (
    <div
      role="group"
      aria-label="Filtros aplicados"
      className="flex flex-wrap items-center gap-1.5"
    >
      {activos.map((k) => {
        const texto = etiquetas[k](filtros[k])
        return (
          <FilterChip key={k} onRemove={() => onQuitar(k)} removeLabel={`Quitar filtro ${texto}`}>
            {texto}
          </FilterChip>
        )
      })}
      <Button variant="text" size="sm" onClick={onLimpiar}>
        {MENSAJES.limpiarFiltros}
      </Button>
    </div>
  )
}
