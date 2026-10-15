import { useState } from 'react'
import { Chip } from '@/components/ui/Chip'
import { FormaCategoria } from '@/components/ui/CategoriaMarca'
import { controlClass } from '@/components/ui/Input'
import { ESPECIE_LABEL } from '@/locales/es'
import type { Categoria } from '@/types/enums'
import { cn } from '@/utils/cn'
import { formatearFechaEntrada, parsearFechaEntrada } from '@/utils/fechas'
import type { FiltrosMapa as Filtros } from '../api'
import { CATEGORIAS_MAPA, leerOcultas, NOMBRE_CORTO } from '../utils'

/** Fecha «dd/mm/aaaa» que se aplica al salir del campo o con Enter; avisa si no es válida. */
function CampoFecha({
  id,
  label,
  valor,
  onCambiar,
}: {
  id: string
  label: string
  valor: string
  onCambiar: (fecha: string) => void
}) {
  const [texto, setTexto] = useState(formatearFechaEntrada(valor))
  const [error, setError] = useState(false)
  const aplicar = () => {
    if (!texto.trim()) {
      setError(false)
      return onCambiar('')
    }
    const f = parsearFechaEntrada(texto)
    setError(!f)
    if (f) onCambiar(f)
  }
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="etiqueta">
        {label} <span className="font-normal text-tinta-terciaria">(dd/mm/aaaa)</span>
      </label>
      <input
        id={id}
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        value={texto}
        aria-invalid={error || undefined}
        aria-describedby={error ? `${id}-e` : undefined}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={aplicar}
        onKeyDown={(e) => e.key === 'Enter' && aplicar()}
        className={cn(controlClass, 'h-10 w-33 tabular-nums')}
      />
      {error && (
        <span id={`${id}-e`} role="alert" className="text-nota font-medium text-peligro">
          Fecha no válida
        </span>
      )}
    </div>
  )
}

interface FiltrosMapaProps {
  filtros: Filtros
  conteos: Record<Categoria, number> | undefined
  onCambiar: (cambios: Partial<Filtros>) => void
}

/** Chips por categoría con su número (activar/desactivar), especie y rango de fechas. */
export function FiltrosMapa({ filtros, conteos, onCambiar }: FiltrosMapaProps) {
  const ocultas = leerOcultas(filtros.ocultas)
  const alternar = (c: Categoria) => {
    const n = new Set(ocultas)
    if (n.has(c)) n.delete(c)
    else n.add(c)
    onCambiar({ ocultas: [...n].join(',') })
  }
  return (
    <div className="flex flex-wrap items-end gap-3">
      <fieldset className="m-0 flex flex-col gap-1 border-0 p-0">
        <legend className="mb-1 p-0 sobretitulo">Categoría fitosanitaria</legend>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIAS_MAPA.map((c) => (
            <Chip key={c} pressed={!ocultas.has(c)} onClick={() => alternar(c)}>
              <FormaCategoria categoria={c} />
              {NOMBRE_CORTO[c]}{' '}
              <span className="font-medium text-tinta-terciaria tabular-nums">
                {conteos?.[c] ?? 0}
              </span>
            </Chip>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-1">
        <label htmlFor="m-esp" className="etiqueta">
          Especie
        </label>
        <select
          id="m-esp"
          value={filtros.especie}
          onChange={(e) => onCambiar({ especie: e.target.value })}
          className={cn(controlClass, 'h-10 w-35 cursor-pointer text-cuerpo-sm')}
        >
          <option value="">Todas</option>
          {Object.entries(ESPECIE_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <CampoFecha
        key={`d-${filtros.desde}`}
        id="m-desde"
        label="Desde"
        valor={filtros.desde}
        onCambiar={(desde) => onCambiar({ desde })}
      />
      <CampoFecha
        key={`h-${filtros.hasta}`}
        id="m-hasta"
        label="Hasta"
        valor={filtros.hasta}
        onCambiar={(hasta) => onCambiar({ hasta })}
      />
    </div>
  )
}
