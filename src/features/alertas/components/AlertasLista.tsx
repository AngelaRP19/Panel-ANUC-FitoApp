import { Link } from 'react-router'
import { Ban, Megaphone, TriangleAlert, type LucideIcon } from 'lucide-react'
import { EstadoAlertaBadge } from '@/components/ui/EstadoBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import type { EstadoAlerta } from '@/types/enums'
import { cn } from '@/utils/cn'
import { formatearFechaHora } from '@/utils/fechas'
import type { AlertaResumen } from '../types'
import { subtituloAlerta, tituloAlerta } from '../utils'

const ICONO: Record<EstadoAlerta, { icono: LucideIcon; clase: string }> = {
  GENERADA: { icono: TriangleAlert, clase: 'bg-advertencia-suave text-advertencia' },
  EN_REVISION: { icono: TriangleAlert, clase: 'bg-revision-suave text-revision' },
  CONFIRMADA: { icono: TriangleAlert, clase: 'bg-peligro-suave text-peligro' },
  COMUNICADA: { icono: Megaphone, clase: 'bg-verde-100 text-verde-700' },
  DESCARTADA: { icono: Ban, clase: 'bg-inactivo-suave text-inactivo' },
}

interface AlertasListaProps {
  alertas: AlertaResumen[]
  cargando: boolean
  seleccionada: string | null
  /** Enlace al detalle de cada alerta (conserva los filtros). */
  hrefDe: (a: AlertaResumen) => string
}

/** Lista de alertas (af-alerta): icono, título, subtítulo, estado, código y fecha. */
export function AlertasLista({ alertas, cargando, seleccionada, hrefDe }: AlertasListaProps) {
  if (cargando) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando alertas">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} style={{ height: 104 }} />
        ))}
      </div>
    )
  }
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0" aria-label="Alertas">
      {alertas.map((a) => {
        const { icono: Icono, clase } = ICONO[a.estado]
        const actual = a.id === seleccionada
        return (
          <li key={a.id}>
            <Link
              to={hrefDe(a)}
              aria-current={actual ? 'true' : undefined}
              className={cn(
                'grid grid-cols-[40px_1fr] gap-4 rounded-lg border bg-blanco px-6 py-4 text-tinta no-underline hover:bg-verde-50',
                actual ? 'border-2 border-verde-700 px-[23px] py-[15px]' : 'border-borde',
              )}
            >
              <span className={cn('grid size-10 place-items-center rounded-md', clase)}>
                <Icono size={22} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block font-titulos text-cuerpo font-semibold">
                  {tituloAlerta(a)}
                </span>
                <span className="mt-0.5 block text-cuerpo-sm text-tinta-secundaria">
                  {subtituloAlerta(a)}
                </span>
                <span className="mt-2 flex flex-wrap items-center gap-2">
                  <EstadoAlertaBadge estado={a.estado} />
                  <span className="text-cuerpo-sm text-tinta-terciaria tabular-nums">
                    <span className="codigo text-nota">{a.id}</span> ·{' '}
                    {formatearFechaHora(a.generada_en)}
                  </span>
                </span>
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
