import { Link } from 'react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { Aviso } from '@/components/ui/Aviso'
import { buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { Spinner } from '@/components/ui/Spinner'
import {
  CasosPorAtender,
  DiagnosticosRecientes,
  KpisTecnico,
  useResumenTecnico,
} from '@/features/inicio'
import { PATHS } from '@/routes/paths'
import { formatearFechaLarga } from '@/utils/fechas'

/** «Ana Lucía Becerra» → «Ana Lucía» (nombres sin el último apellido). */
function saludo(nombre: string) {
  const partes = nombre.trim().split(/\s+/)
  return partes.length >= 3 ? partes.slice(0, -1).join(' ') : partes[0]
}

/**
 * Inicio del técnico (diseño 12a · pantalla 17): saludo, aviso de que solo ve sus casos,
 * KPI propios, casos por atender y diagnósticos recientes.
 */
export default function InicioTecnicoPage() {
  const { data, isPending, isError, refetch } = useResumenTecnico()
  const n = data?.kpis.en_revision ?? 0

  return (
    <>
      <PageHeader
        size="display"
        title={data ? `Hola, ${saludo(data.nombre)}` : 'Inicio'}
        description={
          data &&
          `${formatearFechaLarga(data.generado_en)} · tienes ${n === 1 ? '1 caso' : `${n} casos`} en revisión`
        }
        actions={
          <Link to={`${PATHS.casos}?estado=EN_REVISION`} className={buttonClass('primary')}>
            Revisar mis casos
          </Link>
        }
      />
      {isPending ? (
        <div className="grid place-items-center py-24">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <Card>
          <ErrorState message="No se pudo cargar tu resumen." onRetry={() => refetch()} />
        </Card>
      ) : (
        <>
          <Aviso tono="info">
            Solo ves los casos que el líder técnico te asignó. Si esperas un caso que no aparece,
            pídele a <b className="font-semibold">{data.lider_nombre ?? 'el líder técnico'}</b> que
            te lo asigne.
          </Aviso>
          <KpisTecnico resumen={data} />
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <CasosPorAtender casos={data.por_atender} />
            <DiagnosticosRecientes diagnosticos={data.diagnosticos_recientes} />
          </div>
        </>
      )}
    </>
  )
}
