import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  BotonesExportar,
  ConsultasGuardadas,
  FiltrosAplicados,
  GuardarConsultaModal,
  KpisReporte,
  PanelFiltros,
  Secciones,
  TarjetasReportes,
  useFiltrosReporte,
  useNombresFiltros,
  useResumenReportes,
  type FiltrosReporte,
} from '@/features/reportes'

/**
 * Reportes (diseños 13 y R0 · pantalla 23 · líder): KPI del periodo, los cinco reportes con sus
 * cifras, casos por categoría, por semana y por vereda, carga por técnico y consultas
 * guardadas. Exportar CSV/PDF y filtros generales (F1) en la URL.
 */
export default function ReportesPage() {
  const { filtros, setFiltros } = useFiltrosReporte()
  const { data, isPending, isError, refetch } = useResumenReportes(filtros)
  const nombres = useNombresFiltros()
  const [panel, setPanel] = useState(false)
  const [guardar, setGuardar] = useState<FiltrosReporte | null>(null)

  return (
    <>
      <PageHeader
        title="Reportes"
        description={
          data?.subtitulo ??
          'Información clave de casos, identificación, alertas, productores y técnicos.'
        }
        actions={<BotonesExportar tipo="resumen" filtros={filtros} />}
      />
      <FiltrosAplicados
        filtros={filtros}
        panel="general"
        nombres={nombres}
        onQuitar={(k) => setFiltros({ [k]: '' })}
        onAbrir={() => setPanel(true)}
      />
      {isError && !data ? (
        <Card>
          <ErrorState title="No se pudo cargar el resumen de reportes" onRetry={() => refetch()} />
        </Card>
      ) : isPending ? (
        <Skeleton style={{ height: 520 }} />
      ) : (
        <>
          <KpisReporte kpis={data.kpis} />
          <TarjetasReportes reportes={data.reportes} filtros={filtros} />
          <Secciones secciones={data.secciones} />
        </>
      )}
      <ConsultasGuardadas onGuardarActuales={() => setGuardar(filtros)} />

      {panel && (
        <PanelFiltros
          panel="general"
          tipoConteo="casos"
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
        <GuardarConsultaModal tipo="casos" filtros={guardar} onClose={() => setGuardar(null)} />
      )}
    </>
  )
}
