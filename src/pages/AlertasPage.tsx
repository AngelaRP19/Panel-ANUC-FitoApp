import { Link, useLocation, useParams } from 'react-router'
import { BellRing, Info, SearchX } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Pagination } from '@/components/ui/Pagination'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/context/AuthContext'
import {
  AlertaDetalle,
  AlertasLista,
  AlertasTabs,
  esAlertaNoEncontrada,
  useAlerta,
  useAlertas,
  useFiltrosAlertas,
} from '@/features/alertas'
import { ESTADO_ALERTA_LABEL, etiqueta } from '@/locales/es'
import { PATHS } from '@/routes/paths'
import { Rol } from '@/types/enums'

/**
 * Alertas epidemiológicas (diseño 06 líder · 12g técnico · RQF26): lista por estado y detalle
 * de la alerta seleccionada (`/alertas/:id`). El líder confirma o descarta; el técnico solo
 * consulta. Estado y página viven en la URL.
 */
export default function AlertasPage() {
  const { usuario } = useAuth()
  const esLider = usuario?.rol === Rol.LIDER_TECNICO
  const { id } = useParams()
  const { search } = useLocation()
  const { filtros, setFiltros } = useFiltrosAlertas()
  const lista = useAlertas(filtros)
  // Sin alerta en la ruta, se muestra la primera de la lista.
  const seleccionada = id ?? lista.data?.items[0]?.id ?? null
  const detalle = useAlerta(seleccionada)

  return (
    <>
      <PageHeader
        title="Alertas epidemiológicas"
        description={
          esLider
            ? 'Posibles concentraciones de casos confirmados de Trips. El sistema las detecta; el líder técnico decide si se confirman.'
            : 'Consulta de las alertas de la asociación. Te llegan como notificación si lo activas en tu cuenta.'
        }
      />

      {!esLider && (
        <div
          role="note"
          className="flex flex-wrap items-center gap-3 rounded-md bg-verde-100 px-4 py-3 text-cuerpo-sm text-verde-900"
        >
          <Info size={20} aria-hidden="true" className="flex-none text-verde-700" />
          <p className="min-w-0 flex-1">
            <b className="font-semibold">Solo consulta.</b> Puedes ver las alertas y sus casos, pero
            confirmarlas, descartarlas o comunicarlas le corresponde al líder técnico.
          </p>
          <Link to={PATHS.miCuenta} className={buttonClass('secondary', 'sm')}>
            Configurar notificaciones de alertas
          </Link>
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-12">
        <div className="flex flex-col gap-3 lg:col-span-5">
          <AlertasTabs
            estado={filtros.estado}
            conteos={lista.data?.conteos}
            onChange={(estado) => setFiltros({ estado })}
          />
          {lista.isError && !lista.data ? (
            <Card>
              <ErrorState
                title="No se pudo cargar la lista de alertas"
                onRetry={() => lista.refetch()}
              />
            </Card>
          ) : lista.data && lista.data.total === 0 ? (
            <Card>
              <EmptyState
                icon={filtros.estado ? SearchX : BellRing}
                title={
                  filtros.estado
                    ? `No hay alertas en estado ${etiqueta(ESTADO_ALERTA_LABEL, filtros.estado)}`
                    : 'Aún no hay alertas'
                }
                message={
                  filtros.estado
                    ? undefined
                    : 'El sistema genera una alerta cuando encuentra una posible concentración de casos confirmados.'
                }
              />
            </Card>
          ) : (
            <>
              <AlertasLista
                alertas={lista.data?.items ?? []}
                cargando={lista.isPending}
                seleccionada={seleccionada}
                hrefDe={(a) => `${PATHS.alertas}/${encodeURIComponent(a.id)}${search}`}
              />
              {lista.data && (
                <Card className="overflow-hidden">
                  <Pagination
                    page={lista.data.page}
                    pageSize={lista.data.page_size}
                    total={lista.data.total}
                    noun="alertas"
                    onPageChange={(p) => setFiltros({ page: String(p) })}
                  />
                </Card>
              )}
            </>
          )}
        </div>

        {detalle.data ? (
          <AlertaDetalle key={detalle.data.id} alerta={detalle.data} esLider={esLider} />
        ) : detalle.isError ? (
          <Card className="lg:col-span-7">
            {esAlertaNoEncontrada(detalle.error) ? (
              <ErrorState
                title="La alerta no existe"
                description="Revisa el código o elige una alerta de la lista."
              />
            ) : (
              <ErrorState title="No se pudo cargar la alerta" onRetry={() => detalle.refetch()} />
            )}
          </Card>
        ) : (
          seleccionada && <Skeleton className="lg:col-span-7" style={{ height: 520 }} />
        )}
      </div>
    </>
  )
}
