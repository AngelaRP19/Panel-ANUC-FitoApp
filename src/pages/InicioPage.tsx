import { Link } from 'react-router'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import {
  CargaTecnicos,
  CasosPorCategoria,
  KpiCards,
  PendientesAntiguos,
  ResumenAlertas,
  useResumenPanel,
} from '@/features/inicio'
import { formatearFechaLarga, formatearHora } from '@/utils/fechas'

export default function InicioPage() {
  const { data, isPending, isError, refetch } = useResumenPanel()

  return (
    <>
      <PageHeader
        size="display"
        title="Resumen fitosanitario"
        description={
          data &&
          `${formatearFechaLarga(data.generado_en)} · datos actualizados a las ${formatearHora(data.generado_en)}`
        }
        actions={
          <Link
            to="/casos?estado=PENDIENTE_REVISION"
            className="inline-flex h-10 items-center rounded-md bg-verde-700 px-4 text-cuerpo-sm font-semibold text-blanco no-underline hover:bg-verde-800"
          >
            Revisar pendientes
          </Link>
        }
      />

      {isPending ? (
        <div className="grid place-items-center py-24">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-borde bg-blanco shadow-1">
          <ErrorState message="No se pudo cargar el resumen del panel." onRetry={() => refetch()} />
        </div>
      ) : (
        <>
          <KpiCards resumen={data} />
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <PendientesAntiguos pendientes={data.pendientes_antiguos} />
            <ResumenAlertas alertas={data.alertas} />
            <CasosPorCategoria />
            <CargaTecnicos carga={data.carga_tecnicos} sinTecnico={data.pendientes_sin_tecnico} />
          </div>
        </>
      )}
    </>
  )
}
