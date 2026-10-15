import { useState } from 'react'
import { useParams } from 'react-router'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  BotonesExportar,
  esTipoReporte,
  FiltrosAplicados,
  GuardarConsultaModal,
  KpisReporte,
  PanelFiltros,
  REPORTES,
  Secciones,
  useFiltrosReporte,
  useNombresFiltros,
  useReporte,
  type FiltrosReporte,
  type TipoReporte,
} from '@/features/reportes'
import { PATHS } from '@/routes/paths'

/** Un reporte R1-R5 con su panel de filtros (F1-F4). */
function Reporte({ tipo }: { tipo: TipoReporte }) {
  const meta = REPORTES[tipo]
  const { filtros, setFiltros } = useFiltrosReporte()
  const { data, isPending, isError, refetch } = useReporte(tipo, filtros)
  const nombres = useNombresFiltros()
  const [panel, setPanel] = useState(false)
  const [guardar, setGuardar] = useState<FiltrosReporte | null>(null)

  return (
    <>
      <PageHeader
        title={data?.titulo ?? meta.titulo}
        description={data?.subtitulo}
        breadcrumb={
          <Breadcrumb items={[{ label: 'Reportes', to: PATHS.reportes }, { label: meta.titulo }]} />
        }
        actions={<BotonesExportar tipo={tipo} filtros={filtros} />}
      />
      <FiltrosAplicados
        filtros={filtros}
        panel={meta.panel}
        nombres={nombres}
        onQuitar={(k) => setFiltros({ [k]: '' })}
        onAbrir={() => setPanel(true)}
      />
      {isError && !data ? (
        <Card>
          <ErrorState title="No se pudo cargar el reporte" onRetry={() => refetch()} />
        </Card>
      ) : isPending ? (
        <Skeleton style={{ height: 520 }} />
      ) : (
        <>
          <KpisReporte kpis={data.kpis} />
          <Secciones secciones={data.secciones} />
        </>
      )}
      {panel && (
        <PanelFiltros
          panel={meta.panel}
          tipoConteo={tipo}
          filtros={filtros}
          onClose={() => setPanel(false)}
          onAplicar={(f) => {
            setFiltros(f)
            setPanel(false)
          }}
          onGuardar={(f) => {
            setPanel(false)
            setGuardar(f)
          }}
        />
      )}
      {guardar && (
        <GuardarConsultaModal tipo={tipo} filtros={guardar} onClose={() => setGuardar(null)} />
      )}
    </>
  )
}

/** Reportes R1-R5 (pantalla 24 · líder): `/reportes/:tipo`. */
export default function ReporteDetallePage() {
  const { tipo } = useParams()
  if (!esTipoReporte(tipo)) {
    return (
      <Card>
        <EmptyState
          title="Ese reporte no existe"
          message="Vuelve a Reportes y elige uno de los cinco reportes."
        />
      </Card>
    )
  }
  // `key`: al cambiar de reporte, el estado del panel empieza de nuevo.
  return <Reporte key={tipo} tipo={tipo} />
}
