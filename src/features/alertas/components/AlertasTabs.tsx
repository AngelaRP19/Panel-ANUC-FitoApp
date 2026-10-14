import { Chip } from '@/components/ui/Chip'
import { ESTADO_ALERTA_LABEL } from '@/locales/es'
import type { EstadoAlerta } from '@/types/enums'
import { cn } from '@/utils/cn'
import type { FiltroEstadoAlerta } from '../types'

const ESTADOS: EstadoAlerta[] = [
  'GENERADA',
  'EN_REVISION',
  'CONFIRMADA',
  'COMUNICADA',
  'DESCARTADA',
]

/** Punto de color de cada estado (acompaña al nombre; nunca solo color). */
const PUNTO: Record<EstadoAlerta, string> = {
  GENERADA: 'bg-advertencia',
  EN_REVISION: 'bg-revision',
  CONFIRMADA: 'bg-peligro',
  COMUNICADA: 'bg-verde-700',
  DESCARTADA: 'bg-inactivo',
}

interface AlertasTabsProps {
  /** '' = todas */
  estado: string
  conteos: Record<FiltroEstadoAlerta, number> | undefined
  onChange: (estado: string) => void
}

/** Filtro por estado con contador (chips del diseño 06): Todas · Generada · … · Descartada. */
export function AlertasTabs({ estado, conteos, onChange }: AlertasTabsProps) {
  const contador = (n: number | undefined) =>
    n === undefined ? null : <span className="tabular-nums">{n}</span>
  return (
    <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap gap-1.5">
      <Chip className="h-7.5 text-nota" pressed={estado === ''} onClick={() => onChange('')}>
        Todas {contador(conteos?.TODAS)}
      </Chip>
      {ESTADOS.map((e) => (
        <Chip
          key={e}
          className="h-7.5 text-nota"
          pressed={estado === e}
          onClick={() => onChange(e)}
        >
          <span aria-hidden="true" className={cn('size-2 rounded-full', PUNTO[e])} />
          {ESTADO_ALERTA_LABEL[e]} {contador(conteos?.[e])}
        </Chip>
      ))}
    </div>
  )
}
