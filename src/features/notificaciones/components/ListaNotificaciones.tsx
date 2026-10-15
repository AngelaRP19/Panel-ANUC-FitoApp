import { Link } from 'react-router'
import {
  AlertTriangle,
  Archive,
  Bell,
  ClipboardCheck,
  ClipboardList,
  Search,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { MENSAJES } from '@/locales/es'
import { cn } from '@/utils/cn'
import { useMarcarLeidas, useNotificacionesCampana } from '../hooks'
import { horaNotificacion } from '../utils'

const ICONO: Record<string, { icono: LucideIcon; clase: string }> = {
  CASO_SIN_TECNICO: { icono: ClipboardList, clase: 'bg-advertencia-suave text-advertencia' },
  ALERTA_GENERADA: { icono: AlertTriangle, clase: 'bg-advertencia-suave text-advertencia' },
  ALERTA_CONFIRMADA: { icono: AlertTriangle, clase: 'bg-peligro-suave text-peligro' },
  CASO_EN_REVISION: { icono: Search, clase: 'bg-revision-suave text-revision' },
  CASO_ASIGNADO: { icono: UserPlus, clase: 'bg-verde-100 text-verde-700' },
  DIAGNOSTICO_REGISTRADO: { icono: ClipboardCheck, clase: 'bg-verde-100 text-verde-700' },
  PROXIMOS_A_VENCER: { icono: Archive, clase: 'bg-neutro-suave text-neutro' },
}

/** Botón «Marcar como leídas» del encabezado del panel. */
export function MarcarLeidas() {
  const marcar = useMarcarLeidas()
  const { data } = useNotificacionesCampana(true)
  return (
    <Button
      variant="text"
      size="sm"
      className="h-6 px-1"
      onClick={() => marcar.mutate()}
      loading={marcar.isPending}
      disabled={!data || data.nuevas === 0}
    >
      Marcar como leídas
    </Button>
  )
}

/**
 * Lista de la campana (artboards 02b y 12h · pantalla 18): icono, título, texto y hora; las
 * nuevas, resaltadas. Cada aviso lleva a su pantalla.
 */
export function ListaNotificaciones() {
  const { data, isPending, isError, refetch } = useNotificacionesCampana(true)

  if (isPending) {
    return (
      <div
        className="flex flex-col gap-2 p-4"
        aria-busy="true"
        aria-label="Cargando notificaciones"
      >
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} style={{ height: 44 }} />
        ))}
      </div>
    )
  }
  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-6 text-center text-cuerpo-sm">
        <p className="text-tinta-terciaria">No se pudieron cargar las notificaciones.</p>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          {MENSAJES.reintentar}
        </Button>
      </div>
    )
  }
  if (data.items.length === 0) {
    return (
      <p className="px-4 py-6 text-center text-cuerpo-sm text-tinta-terciaria">
        No tienes notificaciones de los últimos 7 días.
      </p>
    )
  }
  return (
    <ul className="m-0 max-h-[60vh] list-none overflow-y-auto p-0" aria-label="Avisos">
      {data.items.map((n) => {
        const { icono: Icono, clase } = ICONO[n.tipo] ?? {
          icono: Bell,
          clase: 'bg-verde-100 text-verde-700',
        }
        return (
          <li key={n.id}>
            <Link
              to={n.enlace}
              className={cn(
                'grid grid-cols-[32px_1fr_auto] gap-2.5 border-b border-borde px-4 py-3 text-cuerpo-sm text-tinta no-underline hover:bg-verde-50',
                !n.leida && 'bg-verde-50',
              )}
            >
              <span className={cn('grid size-8 place-items-center rounded-md', clase)}>
                <Icono size={16} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <b className="block font-semibold">
                  {n.titulo}
                  {!n.leida && <span className="sr-only"> (nueva)</span>}
                </b>
                <span className="text-tinta-terciaria">{n.texto}</span>
              </span>
              <span className="whitespace-nowrap text-tinta-terciaria tabular-nums">
                {horaNotificacion(n.en)}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
